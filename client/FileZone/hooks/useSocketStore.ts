import {create} from 'zustand';
type storeProps = {
    socket: WebSocket | null
    roomId: string | null
    connect: (roomId: string) => void
}

const useSocketStore = create<storeProps>((set) => ({
    socket: null,
    roomId: null,
    connect: (roomId) => {
        const newSocket = new WebSocket('ws://filezone.fardays.com/ws')
        // const newSocket = new WebSocket("ws://localhost:8080/ws");
        set({socket: newSocket, roomId: roomId})
        const object = {
                type: "join",
                room: roomId
            }
        newSocket.onopen = () => {
            newSocket.send(JSON.stringify(object))
        }
    },
}))

export {useSocketStore}

