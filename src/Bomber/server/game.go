package server

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

func HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	fmt.Println("Client connected")

	go SendPingMessages(conn)

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseGoingAway) {
				handleClientDisconnection(conn)
				break
			}
			fmt.Println("Error reading message:", err)
			handleClientDisconnection(conn)
			break
		}

		if msg.Type == "" {
			conn.WriteJSON(Message{Type: "error", Content: "Invalid message format"})
			continue
		}

		handleMessage(msg, conn)
	}
}

func SendPingMessages(conn *websocket.Conn) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if conn == nil {
				return
			}
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				fmt.Printf("Error sending ping message: %v\n", err)
				handleClientDisconnection(conn)
				return
			}
		}
	}
}

func handleMessage(msg Message, conn *websocket.Conn) {
	switch msg.Type {
	case "join":
		room := GetRoom(msg.Action)
		if room == nil {
			room = NewRoom(msg.Action)
			rooms[room.ID] = room
		}
		HandleJoin(room, conn, msg.Name)
	case "collision":
		room := GetRoom(msg.Action)
		if room != nil {
			HandleCollision(room, msg.Name)
		} else {
			fmt.Println("Room does not exist for message:", msg)
		}
	default:
		room := GetRoom(msg.Action)
		if room != nil {
			SendMessageToClients(msg, room)
		} else {
			fmt.Println("Room does not exist for message:", msg)
		}
	}
}

func HandleJoin(room *Room, conn *websocket.Conn, name string) {
	room.mu.Lock()
	defer room.mu.Unlock()

	if room.GameStarted {
		conn.WriteJSON(Message{Type: "gameStarted", Content: "Game has already started. You cannot join now."})
		CloseConn(conn)
		return
	}

	if _, exists := room.Players[name]; !exists {
		player := &Player{
			ID:         name,
			Name:       name,
			Connection: conn,
			Lives:      3,
		}
		room.Players[name] = player
		room.PlayerCount++

		BroadcastPlayerJoined(room, name)

		if room.PlayerCount >= 4 && !room.CountdownStarted {
			go StartCountdown(room)
		} else if room.PlayerCount >= 2 && !room.CountdownStarted {
			go StartWaitingTimer(room)
		}
	}
}

func StartWaitingTimer(room *Room) {
	time.AfterFunc(maxWaitTime, func() {
		room.mu.Lock()
		defer room.mu.Unlock()

		if room.PlayerCount >= 4 {
			go StartCountdown(room)
		} else if room.PlayerCount >= 2 && !room.CountdownStarted {
			room.CountdownStarted = true
			broadcast <- Message{
				Type:    "waitingForPlayers",
				Content: "Starting countdown in 10 seconds.",
			}
			time.AfterFunc(countdownTime, func() {
				room.mu.Lock()
				defer room.mu.Unlock()

				if room.PlayerCount >= 2 {
					StartCountdown(room)
				} else {
					RemoveRoom(room.ID)
				}
			})
		} else {
			RemoveRoom(room.ID)
		}
	})
}

func StartCountdown(room *Room) {
	room.mu.Lock()
	defer room.mu.Unlock()

	room.CountdownStarted = true
	broadcast <- Message{
		Type:    "gameStarting",
		Content: "Game is starting in 10 seconds!",
	}
	time.AfterFunc(countdownTime, func() {
		room.mu.Lock()
		defer room.mu.Unlock()

		if room.PlayerCount >= 2 {
			room.GameStarted = true
			broadcast <- Message{Type: "gameStarted", Content: "Game is starting!"}
		} else {
			RemoveRoom(room.ID)
		}
	})
}

// handleClientDisconnection handles a player disconnecting
func handleClientDisconnection(conn *websocket.Conn) {
	for _, room := range rooms {
		room.mu.Lock()
		for name, player := range room.Players {
			if player.Connection == conn {
				RemovePlayer(room, player)
				broadcast <- Message{
					Type:        "playerDisconnected",
					Name:        name,
					PlayerCount: room.PlayerCount,
				}
				room.mu.Unlock()
				return
			}
		}
		room.mu.Unlock()
	}
}

// RemovePlayer removes a player from a room
func RemovePlayer(room *Room, player *Player) {
	fmt.Printf("Player %s disconnected\n", player.Name)
	room.mu.Lock()
	defer room.mu.Unlock()

	delete(room.Players, player.ID)
	room.PlayerCount--

	if room.PlayerCount == 1 {
		for _, remainingPlayer := range room.Players {
			err := remainingPlayer.Connection.WriteJSON(Message{
				Type:    "gameEnded",
				Content: "You are the last player remaining. You win!",
			})
			if err != nil {
				fmt.Println("Error sending win message:", err)
			}
		}
		RemoveRoom(room.ID)
	} else if room.PlayerCount < 2 {
		room.CountdownStarted = false
	}

	broadcast <- Message{
		Type:        "playerDisconnected",
		Name:        player.Name,
		PlayerCount: room.PlayerCount,
	}
}

// BroadcastPlayerJoined broadcasts when a player joins a room
func BroadcastPlayerJoined(room *Room, name string) {
	playerOrder := make([]string, 0, len(room.Players))
	for playerName := range room.Players {
		playerOrder = append(playerOrder, playerName)
	}

	broadcast <- Message{
		Type:        "playerJoined",
		Name:        name,
		Action:      room.ID,
		Seconds:     int(maxWaitTime.Seconds()),
		PlayerCount: room.PlayerCount,
		PlayerOrder: playerOrder,
	}
}

// HandleCollision handles player collisions
func HandleCollision(room *Room, name string) {
	room.mu.Lock()
	defer room.mu.Unlock()

	player, exists := room.Players[name]
	if !exists {
		return
	}

	player.Lives--
	if player.Lives <= 0 {
		RemovePlayer(room, player)
		broadcast <- Message{
			Type:    "playerEliminated",
			Name:    name,
			Content: "You have lost all your lives!",
		}
		if room.PlayerCount > 1 {
			return
		}
		EndGame(room)
	} else {
		broadcast <- Message{
			Type:  "updateLives",
			Name:  name,
			Lives: player.Lives,
		}
	}
}

// CloseConn closes a WebSocket connection
func CloseConn(conn *websocket.Conn) {
	conn.Close()
}

// contains checks if a player exists in the map
func contains(players map[string]*Player, target string) bool {
	for _, player := range players {
		if player.Name == target {
			return true
		}
	}
	return false
}

// GetRoom retrieves a room by its ID
func GetRoom(roomID string) *Room {
	return rooms[roomID]
}

// NewRoom creates a new room with the given ID
func NewRoom(id string) *Room {
	return &Room{
		ID:            id,
		Players:       make(map[string]*Player),
		MaxPlayers:    4,
		WaitingTime:   maxWaitTime,
		CountdownTime: countdownTime,
	}
}

// RemoveRoom removes a room from the map
func RemoveRoom(id string) {
	delete(rooms, id)
}
