import { create } from 'zustand';
import { WebRTCPeerManager } from '../utils/peerManager'
type StoreProps = {
    PeerManager: WebRTCPeerManager | null
    setNewPeerManager: (
        socket: WebSocket, 
        userId: string, 
        roomId: string, 
        onFileReceived: onFileReceived
    ) => void
}
type onFileReceived = (file:Blob, fileName:string, from:string) => void

const usePeerStore = create<StoreProps>((set) => ({
    PeerManager: null,
    setNewPeerManager: (socket: WebSocket, userId: string, roomId: string, onFileReceived: onFileReceived) =>{
        const peerManager = new WebRTCPeerManager(socket,userId, roomId, onFileReceived);
        set({PeerManager: peerManager});
    }
}))

export { usePeerStore };