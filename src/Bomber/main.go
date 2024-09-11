package main

import (
	"bomberman/server"
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", server.HandleConnection)

	go server.HandleMessages()

	fmt.Println("Server started at ws://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
