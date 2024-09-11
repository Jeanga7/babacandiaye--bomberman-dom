package server

import (
	"fmt"
	"sync"
	"time"
)

var (
	mu               sync.Mutex
	countdownStarted = false
	gameStarted      = false
	playerOrder      = []string{}
	playerCount      = 0
	maxWaitTime      = 20
)

type Message struct {
	Type        string   `json:"type"`
	Name        string   `json:"name"`
	Content     string   `json:"content"`
	Action      string   `json:"action"`
	Seconds     int      `json:"seconds,omitempty"`
	PlayerCount int      `json:"playerCount,omitempty"`
	PlayerOrder []string `json:"playerOrder,omitempty"`
}

func HandleMessages() {
	for msg := range broadcast {
		SendMessageToClients(msg)
	}
}

func SendMessageToClients(msg Message) {
	mu.Lock()
	defer mu.Unlock()

	for client := range waitingRoom {
		if err := client.WriteJSON(msg); err != nil {
			fmt.Println("Error sending message to client:", err)
			HandleDisconnection(client)
		} else {
			fmt.Println("Message sent to client:", msg)
		}
	}
}

func RemovePlayerFromOrder(name string) {
	for i, player := range playerOrder {
		if player == name {
			playerOrder = append(playerOrder[:i], playerOrder[i+1:]...)
			break
		}
	}
}

func StartCountdown() {
	countdownStarted = true
	defer func() { countdownStarted = false }()

	for i := 0; i < 2; i++ {
		time.Sleep(1 * time.Second)
		maxWaitTime--

		if playerCount == 4 || !countdownStarted {
			break
		}
	}

	if playerCount >= 2 {
		gameStarted = true
		broadcast <- Message{Type: "startPreparation"}
		time.Sleep(1 * time.Second)
		broadcast <- Message{Type: "startGame"}
	} else {
		broadcast <- Message{Type: "notEnoughPlayers"}
	}

	maxWaitTime = 20
}

func EndGame() {
	gameStarted = false
	broadcast <- Message{Type: "gameEnded", Content: "The game has been stopped due to insufficient players."}
	for client := range waitingRoom {
		conn := client
		conn.WriteJSON(Message{Type: "gameEnded", Content: "The game has been stopped. Returning to the home screen."})
		CloseConn(conn)
	}
	playerOrder = []string{}
	playerCount = 0
	maxWaitTime = 20
}
