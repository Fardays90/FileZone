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
        let receivingFileNames = new Map<string, string>();
        const filesToSend = useFileStore.getState().filesToSend;
        channel.onmessage = (event) => {
            const data = event.data;
            if(data instanceof ArrayBuffer){
                const dataArr = new Uint8Array(data);
                const fileId = dataArr.subarray(0, 16).join(',');
                const blobArray = receivingFilesChunks.get(fileId);
                const requiredData = dataArr.subarray(16, dataArr.length);
                const blob = new Blob([requiredData]);
                const obj = {type: 'ack', amount: requiredData.length, fileId: fileId}
                channel.send(JSON.stringify(obj));
                if(blobArray){
                    blobArray.push(blob);
                }
            } else {
                const message = JSON.parse(data);
                const fileId = message.fileId;
                if(message.type === "meta"){ 
                    const chunkExists = receivingFilesChunks.get(fileId);
                    if(!chunkExists){
                        const chunks: Blob[] = [];
                        receivingFilesChunks.set(fileId, chunks);
                        console.log('filename at line 55: '+message.fileName)
                        receivingFileNames.set(fileId, message.fileName);
                    }
                }
                else if(message.type === 'ack'){
                    console.log('ack received from '+peerId+" for "+this.userId)
                    const fileName = receivingFileNames.get(message.fileId);
                    if(fileName){
                        console.log('file name: '+fileName)
                        console.log('--------------------------------------------------------------------------- '+fileName)
                        useFileStore.getState().updateProgressSending({name: fileName, amount: message.amount})
                    }
                }
                else if(message.type === "done"){
                    const chunks = receivingFilesChunks.get(message.fileId);
                    const file = new Blob(chunks);
                    receivingFilesChunks.delete(fileId);
                    this.onFileReceived(file, message.fileName, peerId);
                }
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
    private uuidToBytes(uuid: string){
        const req = uuid.replace(/-/g, '');
        const byteArr = new Uint8Array(16); // as uuid here is 32 hex characters after removing hyphens hence 16 bytes
        for(let i = 0; i < 16; i++){
            byteArr[i] = parseInt(req.substring(i * 2, (i * 2) + 2), 16);
        }
        return byteArr;
    }
    public sendFile(peerId: string, file: File){
        const channel = this.dataChannels.get(peerId);
        if(!channel || channel.readyState !== "open"){
            return;
        }
        const reader = file.stream().getReader();
        const fileId = this.uuidToBytes(crypto.randomUUID());
        channel.send(JSON.stringify({type:"meta", fileName:file.name, fileId: fileId.join(','), totalSize: file.size}));
        const readChunk = async () => {
            const { done, value } = await reader.read();
            if(done){
                channel.send(JSON.stringify({type:"done", fileId: fileId.join(','), fileName: file.name}));
                return;
            }
            const arr = new Uint8Array(fileId.length + value.length); // basically adding the uuid with the binary
            for(let i = 0; i < arr.length; i++){
                if(i >= fileId.length){
                    arr[i] = value[i - 16];
                    continue
                }
                arr[i] = fileId[i];
            }
            channel.send(arr.buffer);
            // channel.send(JSON.stringify({type:"chunk", data: Array.from(value),  fileId}));
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

