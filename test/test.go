package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type testjson struct {
	Test string `json:"test"`
}

func home(w http.ResponseWriter, r *http.Request) {
	response := &testjson{Test: "Working hello"}
	responseJson, err := json.Marshal(response)
	if err != nil {
		fmt.Println("Error converting to json")
		return
	}
	w.Write(responseJson)
}
func main() {
	http.HandleFunc("/", home)
	port := ":5172"
	fmt.Println("Server started on port 5172")
	http.ListenAndServe(port, nil)
}
