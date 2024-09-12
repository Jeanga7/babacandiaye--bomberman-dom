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
	fmt.Println("msg depuis front", msg)
	switch msg.Type {
	case "join":
		HandleJoin(conn, msg.Name)
	case "collision":
		HandleCollision(msg.Name)
	default:
		SendMessageToClients(msg, room)
	}
}

func HandleJoin(conn *websocket.Conn, name string) {
	room.mu.Lock()
	defer room.mu.Unlock()

	if room.GameStarted {
		conn.WriteJSON(Message{Type: "gameStarted", Content: "Game has already started. You cannot join now."})
		CloseConn(conn)
		return
	}

	if _, exists := room.Players[name]; !exists {
		player := &Player{
			Name:       name,
			Connection: conn,
			Lives:      3,
		}
		room.Players[name] = player
		room.PlayerCount++

		BroadcastPlayerJoined(name)

		if room.PlayerCount >= 4 && !room.CountdownStarted {
			go StartCountdown()
		} else if room.PlayerCount >= 2 && !room.CountdownStarted {
			go StartWaitingTimer()
		}
	}
}

func StartWaitingTimer() {
	time.AfterFunc(room.WaitingTime, func() {
		room.mu.Lock()
		defer room.mu.Unlock()

		playerOrder := make([]Player, 0, len(room.Players))
		for _, player := range room.Players {
			playerOrder = append(playerOrder, Player{
				Name:  player.Name,
				Lives: player.Lives,
			})
		}

		if room.PlayerCount >= 4 {
			go StartCountdown()
		} else if room.PlayerCount >= 2 && !room.CountdownStarted {
			room.CountdownStarted = true
			broadcast <- Message{
				Type:        "startPreparation",
				Content:     "Starting countdown in 10 seconds.",
				PlayerCount: room.PlayerCount,
				PlayerOrder: playerOrder,
			}
			time.AfterFunc(room.CountdownTime, func() {
				room.mu.Lock()
				defer room.mu.Unlock()

				if room.PlayerCount >= 2 {
					StartCountdown()
				} else {
					RemoveRoom()
				}
			})
		} else {
			RemoveRoom()
		}
	})
}

func StartCountdown() {
	room.mu.Lock()
	defer room.mu.Unlock()

	room.CountdownStarted = true
	broadcast <- Message{
		Type:    "gameStarting",
		Content: "Game is starting in 10 seconds!",
	}
	time.AfterFunc(room.CountdownTime, func() {
		room.mu.Lock()
		defer room.mu.Unlock()

		if room.PlayerCount >= 2 {
			room.GameStarted = true
			broadcast <- Message{Type: "gameStarted", Content: "Game is starting!"}
		} else {
			RemoveRoom()
		}
	})
}

func handleClientDisconnection(conn *websocket.Conn) {
	room.mu.Lock()
	defer room.mu.Unlock()

	for name, player := range room.Players {
		if player.Connection == conn {
			RemovePlayer(player)
			broadcast <- Message{
				Type:        "playerDisconnected",
				Name:        name,
				PlayerCount: room.PlayerCount,
			}
			return
		}
	}
}

func RemovePlayer(player *Player) {
	fmt.Printf("Player %s disconnected\n", player.Name)
	room.mu.Lock()
	defer room.mu.Unlock()

	delete(room.Players, player.Name)
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
		RemoveRoom()
	} else if room.PlayerCount < 2 {
		room.CountdownStarted = false
	}

	broadcast <- Message{
		Type:        "playerDisconnected",
		Name:        player.Name,
		PlayerCount: room.PlayerCount,
	}
}

func BroadcastPlayerJoined(name string) {
	playerOrder := make([]Player, 0, len(room.Players))
	for _, player := range room.Players {
		playerOrder = append(playerOrder, Player{
			Name:  player.Name,
			Lives: player.Lives,
		})
	}

	broadcast <- Message{
		Type:        "playerJoined",
		Name:        name,
		Seconds:     int(room.WaitingTime.Seconds()),
		PlayerCount: room.PlayerCount,
		PlayerOrder: playerOrder,
	}
}

func HandleCollision(name string) {
	room.mu.Lock()
	defer room.mu.Unlock()

	player, exists := room.Players[name]
	if !exists {
		return
	}

	player.Lives--
	if player.Lives <= 0 {
		RemovePlayer(player)
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

func CloseConn(conn *websocket.Conn) {
	conn.Close()
}

func RemoveRoom() {
	room = &Room{
		Players:       make(map[string]*Player),
		MaxPlayers:    4,
		WaitingTime:   20 * time.Second,
		CountdownTime: 10 * time.Second,
	}
}
