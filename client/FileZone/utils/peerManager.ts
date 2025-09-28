import {useFileStore} from '../hooks/useFileStore';

type RTCSignalMessage = 
| {type:"offer", offer:RTCSessionDescriptionInit, to: string }
| {type:"answer", answer:RTCSessionDescriptionInit, to: string } 
| {type:"candidate", candidate:RTCIceCandidateInit, to: string }

type SignalMessage = {message: RTCSignalMessage, roomId: string, sender: string, type: string}

type onFileReceived = (file:Blob, fileName:string, from:string) => void

export class WebRTCPeerManager{
    private peers: Map<string, RTCPeerConnection> = new Map();
    private dataChannels: Map<string, RTCDataChannel> = new Map();
    private socket: WebSocket
    private userId: string
    private roomId: string
    private onFileReceived: onFileReceived
    constructor(socket: WebSocket, userId: string, roomId:string, onFileReceived: onFileReceived){
        this.socket = socket;
        this.userId = userId;
        this.roomId = roomId;
        this.onFileReceived = onFileReceived;
    }
    private sendSignal(msg: RTCSignalMessage){
        this.socket.send(JSON.stringify({
            message:msg, roomId: this.roomId, sender: this.userId, type: msg.type
        }))
    }
    private setupDataChannel(peerId:string, channel: RTCDataChannel){
        this.dataChannels.set(peerId, channel);
        let receivingFilesChunks = new Map <string,Blob[]>();
        let fileName = "";
        channel.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const fileId = data.fileId;
            if(data.type === "meta"){ 
                const chunkExists = receivingFilesChunks.get(fileId);
                if(!chunkExists){
                    const chunks: Blob[] = [];
                    receivingFilesChunks.set(fileId, chunks);
                }
                fileName = data.fileName
            }
            else if(data.type === "chunk"){
                const chunksArr = receivingFilesChunks.get(fileId); 
                if(chunksArr){
                    const obj = {type: 'ack', fileName: fileName, amount: data.data.length, fileId: fileId}
                    console.log(data.data.length)
                    channel.send(JSON.stringify(obj))
                    chunksArr.push(new Blob([new Uint8Array(data.data)]));
                }
            }
            else if(data.type === 'ack'){
                useFileStore.getState().updateProgressSending({name: data.fileName, amount: data.amount})
            }
            else if(data.type === "done"){
                const chunks = receivingFilesChunks.get(fileId);
                const file = new Blob(chunks);
                receivingFilesChunks.delete(fileId);
                this.onFileReceived(file, fileName, peerId);
            }
        }
    }
    private createPeerConnection(peerId: string, isInitiator: boolean){
        console.log(`Creating peer connection for ${peerId}, initiator: ${isInitiator}`);
        const pc = new RTCPeerConnection({
            iceServers:[
                { urls:'stun:stun.l.google.com:19302' },
                { urls: "stun:stun.l.google.com:5349" },
                { urls: "stun:stun1.l.google.com:3478" },
                {
                    urls: "turn:global.relay.metered.ca:80",
                    username: "251a0a5b1037f612b8e1138b",
                    credential: "MbmSti251mG768BO",
                },
                {
                    urls: "turn:global.relay.metered.ca:80?transport=tcp",
                    username: "251a0a5b1037f612b8e1138b",
                    credential: "MbmSti251mG768BO",
                },
                {
                    urls: "turn:global.relay.metered.ca:443",
                    username: "251a0a5b1037f612b8e1138b",
                    credential: "MbmSti251mG768BO",
                },
                {
                    urls: "turns:global.relay.metered.ca:443?transport=tcp",
                    username: "251a0a5b1037f612b8e1138b",
                    credential: "MbmSti251mG768BO",
                },
            ]
        });
        pc.onicecandidate = (event) => {
            if(event.candidate){
                console.log(`New ICE candidate of [${this.userId}] for [${peerId}]`, event.candidate.candidate);
                this.sendSignal({
                    type:"candidate",
                    candidate: event.candidate.toJSON(),
                    to:peerId
                })
            }
        }
        pc.ondatachannel = (event) => {
            console.log(`data channel of ${this.userId} and ${peerId} has been set up`)
            this.setupDataChannel(peerId, event.channel);
        }
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === "connected") {
                console.log(`✅ Peer-to-peer connection established with ${peerId}`);
            } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
                console.warn(`⚠️ Connection problem with ${peerId}: ${pc.connectionState}`);
            }
        }
        
        if(isInitiator){
            const channel = pc.createDataChannel("files");
            this.setupDataChannel(peerId, channel);
        }
        this.peers.set(peerId, pc);
        return pc;
    }
    public async connectToPeer(peerId: string){
        const pc = this.createPeerConnection(peerId, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignal({
            type:"offer",
            offer,
            to: peerId
        });
    }
    public async handleSignal(data: SignalMessage){
        console.log('got signal ',data)
        const { sender } = data;
        let pc = this.peers.get(sender);
        if(!pc){
            pc = this.createPeerConnection(sender, false);
        }
        if(data.message.type === "offer"){
            await pc.setRemoteDescription(new RTCSessionDescription(data.message.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(new RTCSessionDescription(answer));
            this.sendSignal({type:"answer", answer, to:sender})
        }
        else if(data.message.type === "answer"){
            await pc.setRemoteDescription(new RTCSessionDescription(data.message.answer))
        }
        else if(data.message.type === "candidate"){
            try{
                await pc.addIceCandidate(data.message.candidate)
            }
            catch{
                console.log("Error trying to add candidate")
            }
        }
    }
    public sendFile(peerId: string, file: File){
        const channel = this.dataChannels.get(peerId);
        if(!channel || channel.readyState !== "open"){
            return;
        }
        const reader = file.stream().getReader();
        const fileId = crypto.randomUUID();
        channel.send(JSON.stringify({type:"meta", fileName:file.name, fileId, totalSize: file.size}));
        const readChunk = async () => {
            const { done, value } = await reader.read();
            if(done){
                channel.send(JSON.stringify({type:"done", fileId}));
                return;
            }
            channel.send(JSON.stringify({type:"chunk", data: Array.from(value),  fileId}));
            readChunk();
        }
        readChunk();
    }
    public broadcastFile(file:File){
        for(const peerId of this.dataChannels.keys()){
            this.sendFile(peerId, file);
        }
    }
    public getPeers(){
        return [...this.peers.keys()]
    }
}

