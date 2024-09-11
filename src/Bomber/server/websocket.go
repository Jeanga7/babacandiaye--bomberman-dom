package server

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Player struct {
	ID         string
	Name       string
	Connection *websocket.Conn
	Lives      int
}

type Room struct {
	ID               string
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
	rooms         = make(map[string]*Room)
	broadcast     = make(chan Message)
	maxWaitTime   = 20 * time.Second
	countdownTime = 10 * time.Second
)

type Message struct {
	Type        string   `json:"type"`
	Name        string   `json:"name"`
	Content     string   `json:"content"`
	Action      string   `json:"action"`
	Seconds     int      `json:"seconds,omitempty"`
	PlayerCount int      `json:"playerCount,omitempty"`
	PlayerOrder []string `json:"playerOrder,omitempty"`
	Lives       int      `json:"lives,omitempty"`
}

func HandleMessages() {
	for msg := range broadcast {
		if room, exists := rooms[msg.Action]; exists {
			SendMessageToClients(msg, room)
		} else {
			fmt.Println("Room does not exist for message:", msg)
		}
	}
}

func SendMessageToClients(msg Message, room *Room) {
    room.mu.Lock()
    defer room.mu.Unlock()

    for _, player := range room.Players {
        if err := player.Connection.WriteJSON(msg); err != nil {
            fmt.Println("Error sending message to client:", err)
            HandleDisconnection(player.Connection)
        } else {
            fmt.Println("Message sent to client:", msg)
        }
    }
}

func EndGame(room *Room) {
	room.GameOver = true
	for _, player := range room.Players {
		player.Connection.WriteJSON(Message{
			Type:    "gameEnded",
			Content: "Game Over!",
		})
	}
	ResetGame(room)
}
