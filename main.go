package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	roomId string
	conn   *websocket.Conn
}
type Response struct {
	RoomId string `json:"roomId"`
}

var charset = "abcdefghijklmnopqrtsxyz123456789"

var rooms = make(map[string][]*Client)
var usernameToConn = make(map[string]*websocket.Conn)
var reverseRooms = make(map[string]string) //zis is for username -> roomId ez
var usernames = make(map[string][]string)
var mutex = &sync.Mutex{}

var upgrader = &websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type usernameJson struct {
	Type     string `json:"type"`
	Username string `json:"username"`
}
type usernamesJson struct {
	Type      string   `json:"type"`
	Usernames []string `json:"usernames"`
}

type messageStruct struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}
type justJoined struct {
	Type string `json:"type"`
	New  bool   `json:"new"`
}

func generateRandomId() string {
	length := 5
	randomId := make([]byte, length)
	for i := range randomId {
		randomId[i] = charset[rand.Intn(len(charset))]
	}
	return string(randomId)
}
func wakeServer(w http.ResponseWriter, r *http.Request) {
	enableCors(&w, r)
	var testMap = make(map[string]any)
	testMap["type"] = "test"
	testMap["message"] = "something"
	json, err := json.Marshal(testMap)
	if err != nil {
		fmt.Println("err trying to make json")
		return
	}
	w.Write(json)
	w.WriteHeader(http.StatusOK)
	fmt.Println("Received wake up req")
}

var allowedOrigins = map[string]bool{
	"http://localhost:5173":       true,
	"https://filezone.pages.dev/": true,
}

func enableCors(w *http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	found := allowedOrigins[origin]
	if !found {
		return
	}
	(*w).Header().Set("Access-Control-Allow-Origin", origin)

}

func handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error trying to upgrade http to websocket")
		return
	}
	defer conn.Close()
	username := generateRandomId()
	mutex.Lock()
	usernameToConn[username] = conn
	mutex.Unlock()
	err = conn.WriteJSON(&usernameJson{Type: "username", Username: username})
	if err != nil {
		fmt.Println("Error trying to send username to " + username)
	}
	err = conn.WriteJSON(&justJoined{Type: "justJoined", New: true})
	if err != nil {
		fmt.Println("Error trying to send just joined state to " + username)
	}
	var client *Client
	ticker := time.NewTicker(20 * time.Second)
	go func() {
		for range ticker.C {
			err := conn.WriteControl(websocket.PingMessage, []byte("keepalive"), time.Now().Add(time.Second))
			if err != nil {
				log.Println("Stopping sending pings to " + username)
				ticker.Stop()
				break
			}
		}
	}()

	for {
		var msg map[string]any
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Printf("Connection closed for %s \n", username)
			mutex.Lock()
			roomId := reverseRooms[username]
			websocketConns := rooms[roomId]
			usernameElements := usernames[roomId]
			var newWebsocketConns []*Client
			var newUsernames []string
			for _, client := range websocketConns {
				if client.conn != conn {
					newWebsocketConns = append(newWebsocketConns, client)
				}
			}
			for _, currUsername := range usernameElements {
				if currUsername != username {
					newUsernames = append(newUsernames, currUsername)
				}
			}
			rooms[roomId] = newWebsocketConns
			usernames[roomId] = newUsernames
			delete(reverseRooms, username)
			var newUsernamesToSend *usernamesJson = &usernamesJson{Type: "usernames", Usernames: newUsernames}
			leaveMessage := &messageStruct{Type: "alert", Message: "A user left the room"}
			for _, client := range newWebsocketConns {
				client.conn.WriteJSON(newUsernamesToSend)
				client.conn.WriteJSON(leaveMessage)
			}
			mutex.Unlock()
			break
		}
		switch msg["type"] {
		case "join":
			roomId := msg["room"].(string)
			client = &Client{conn: conn, roomId: roomId}
			clients := rooms[roomId]
			clientNames := usernames[roomId]
			mutex.Lock()
			rooms[roomId] = append(clients, client)
			usernames[roomId] = append(clientNames, username)
			reverseRooms[username] = roomId
			var usernamesToSend *usernamesJson = &usernamesJson{
				Type: "usernames", Usernames: usernames[roomId],
			}
			mutex.Unlock()
			fmt.Println("Room: " + roomId)
			newClientNames := usernames[roomId]
			fmt.Println("A client joined the room")
			fmt.Println("Currently in the room: ")
			for _, c := range newClientNames {
				fmt.Println(c)
			}
			joinMessage := &messageStruct{Type: "alert", Message: "A new user joined the room"}
			newClients := rooms[roomId]
			for _, c := range newClients {
				c.conn.WriteJSON(usernamesToSend)
				if c.conn != conn {
					c.conn.WriteJSON(joinMessage)
				}
			}
		case "offer", "answer", "candidate":
			roomId := msg["roomId"].(string)
			mutex.Lock()
			_, found := rooms[roomId]
			mutex.Unlock()
			if !found {
				fmt.Println("Room not found / does not exist")
				return
			}
			data := msg["message"].(map[string]any)
			recipient := data["to"].(string)
			mutex.Lock()
			recipientConn, found := usernameToConn[recipient]
			mutex.Unlock()
			if !found {
				fmt.Println("User not found")
			}
			jsonMsg, err := json.Marshal(msg)
			if err != nil {
				fmt.Println("Error trying to convert RTCData to json for logging")
			}
			fmt.Println("Sending " + string(jsonMsg) + " to " + recipient)
			err = recipientConn.WriteJSON(msg)
			if err != nil {
				fmt.Println("Error trying to send signal message to " + recipient)
			}
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleConnection)
	http.HandleFunc("/wake", wakeServer)
	port := ":8080"
	fmt.Println("Server started at port" + port)
	err := http.ListenAndServe(port, nil)
	if err != nil {
		fmt.Println("Error trying to start the server.")
	}
}
