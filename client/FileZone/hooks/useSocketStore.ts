import {create} from 'zustand';
type storeProps = {
    socket: WebSocket | null
    roomId: string | null
    state: boolean
    connect: (roomId: string) => void
}

const useSocketStore = create<storeProps>((set) => ({
    socket: null,
    roomId: null,
    state: false,
    connect: (roomId) => {
        // const newSocket = new WebSocket('wss://filezone.fardays.com/ws')
        const newSocket = new WebSocket("ws://localhost:8080/ws");
        set({socket: newSocket, roomId: roomId, state: true})
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

