package main

import (
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var clients = make(map[*websocket.Conn]string)
var broadcast = make(chan Message)

type Message struct {
	Type    string `json:"type"`
	Name    string `json:"name"`
	Content string `json:"content"`
}

func handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	clients[conn] = ""
	fmt.Println("Client connected")

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Println("Error reading message:", err)
			delete(clients, conn)
			break
		}

		broadcast <- msg
	}
}

func handleMessages() {

	for {
		msg := <-broadcast
		for client, name := range clients {
			if name != msg.Name {
				err := client.WriteJSON(msg)
				if err != nil {
					fmt.Println("Error sending message:", err)
					client.Close()
					delete(clients, client)
				}
			}
		}
	}
}

func main() {
	http.HandleFunc("/", handleConnection)

	go handleMessages()

	fmt.Println("Server started at ws://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
