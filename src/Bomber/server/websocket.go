package server

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Player struct {
	Name       string
	Connection *websocket.Conn
	Lives      int
}

type Room struct {
	Players          map[string]*Player
	PlayerCount      int
	MaxPlayers       int
	WaitingTime      time.Duration
	CountdownTime    time.Duration
	CountdownStarted bool
	GameStarted      bool
	GameOver         bool
	mu               sync.Mutex
}

var (
	upgrader      = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	room          = &Room{
		Players:       make(map[string]*Player),
		MaxPlayers:    4,
		WaitingTime:   20 * time.Second,
		CountdownTime: 10 * time.Second,
	}
	broadcast     = make(chan Message)
)

type Message struct {
	Type        string   `json:"type"`
	Name        string   `json:"name"`
	Content     string   `json:"content"`
	Action      string   `json:"action"`
	Seconds     int      `json:"seconds,omitempty"`
	PlayerCount int      `json:"playerCount,omitempty"`
	PlayerOrder []Player `json:"playerOrder,omitempty"`
	Lives       int      `json:"lives,omitempty"`
}

func HandleMessages() {
	for msg := range broadcast {
		fmt.Println("Received message:", msg)
		SendMessageToClients(msg, room)
	}
}

func SendMessageToClients(msg Message, room *Room) {
	for _, player := range room.Players {
		if err := player.Connection.WriteJSON(msg); err != nil {
			fmt.Println("Error sending message to client:", err)
			handleClientDisconnection(player.Connection)
		} else {
			fmt.Println("Message sent to client:", msg)
		}
	}
}

func EndGame(room *Room) {
	room.mu.Lock()
	defer room.mu.Unlock()

	if !room.GameOver {
		room.GameOver = true
		broadcast <- Message{
			Type:    "gameOver",
			Content: "The game has ended!",
		}
	}
}
