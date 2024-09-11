package server

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

func init() {
	rooms["defaultRoom"] = &Room{
		ID:               "defaultRoom",
		Players:          make(map[string]*Player),
		MaxPlayers:       4,
		WaitingTime:      maxWaitTime,
		CountdownTime:    countdownTime,
		CountdownStarted: false,
		GameStarted:      false,
		GameOver:         false,
	}
}

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
			fmt.Println("Error reading message:", err)
			HandleDisconnection(conn)
			break
		}
		if msg.Type == "" {
			conn.WriteJSON(Message{Type: "error", Content: "Invalid message format"})
			continue
		}

		switch msg.Type {
		case "join":
			room, exists := rooms["defaultRoom"]
			if !exists {
				conn.WriteJSON(Message{Type: "error", Content: "Room does not exist"})
				break
			}

			if contains(room.Players, msg.Name) {
				conn.WriteJSON(Message{Type: "pseudoUsed"})
				break
			}
			HandleJoin(room, conn, msg.Name)
		case "collision":
			room, exists := rooms["defaultRoom"]
			if exists {
				HandleCollision(room, msg.Name)
			} else {
				conn.WriteJSON(Message{Type: "error", Content: "Room does not exist"})
			}
		default:
			if room, exists := rooms[msg.Action]; exists {
				SendMessageToClients(msg, room)
			} else {
				fmt.Println("Room does not exist for message:", msg)
			}
		}
	}
}

func SendPingMessages(conn *websocket.Conn) {
	for {
		time.Sleep(10 * time.Second)
		if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
			HandleDisconnection(conn)
			return
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
					ResetGame(room)
				}
			})
		} else {
			ResetGame(room)
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
			ResetGame(room)
		}
	})
}

func HandleDisconnection(conn *websocket.Conn) {
	var playerName string
	for _, room := range rooms {
		room.mu.Lock()
		for _, player := range room.Players {
			if player.Connection == conn {
				playerName = player.Name
				RemovePlayer(room, player)
				room.mu.Unlock()
				broadcast <- Message{
					Type:        "playerDisconnected",
					Name:        playerName,
					PlayerCount: room.PlayerCount,
				}
				return
			}
		}
		room.mu.Unlock()
	}
}

func RemovePlayer(room *Room, player *Player) {
	room.mu.Lock()
	defer room.mu.Unlock()

	fmt.Printf("Player %s disconnected\n", player.Name)
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
		ResetGame(room)
	} else if room.PlayerCount < 2 {
		room.CountdownStarted = false
	}

	broadcast <- Message{
		Type:        "playerDisconnected",
		Name:        player.Name,
		PlayerCount: room.PlayerCount,
	}
}

func BroadcastPlayerJoined(room *Room, name string) {
	// room.mu.Lock()
	// defer room.mu.Unlock()
	
	fmt.Println("msg", name)
	fmt.Println("room", room)

	broadcast <- Message{
		Type:        "playerJoined",
		Name:        name,
		Seconds:     int(maxWaitTime.Seconds()),
		PlayerCount: room.PlayerCount,
	}
}

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

func ResetGame(room *Room) {
	room.mu.Lock()
	defer room.mu.Unlock()

	room.Players = make(map[string]*Player)
	room.PlayerCount = 0
	room.CountdownStarted = false
	room.GameStarted = false

	fmt.Println("Game has been reset and is ready for new players.")
}

func CloseConn(conn *websocket.Conn) {
	conn.Close()
}

func contains(players map[string]*Player, target string) bool {
	for _, player := range players {
		if player.Name == target {
			return true
		}
	}
	return false
}
