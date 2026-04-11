import {useFileStore} from '../hooks/useFileStore';

type RTCSignalMessage = 
| {type:"offer", offer:RTCSessionDescriptionInit, to: string }
| {type:"answer", answer:RTCSessionDescriptionInit, to: string } 
| {type:"candidate", candidate:RTCIceCandidateInit, to: string }

type SignalMessage = {message: RTCSignalMessage, roomId: string, sender: string, type: string}

type FileId = {
    originalHex: string,
    byteArray: Uint8Array
}

// type Intent = {
//     type: string,
//     intentId: string,
//     fileSize: number,
//     peerId: string,
// }


type onFileReceived = (fileName:string, from:string) => void

const opfsWorker = new Worker(new URL('./opfsWriter.ts', import.meta.url), {type: 'module'})

opfsWorker.onmessage = ({ data }) => {
    if(data.type === 'done'){
        const anchor = document.createElement('a');
        anchor.href = `/download/${data.fileName}`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
    }
}

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
        let receivingFileNames = new Map<string, string>();
        let receivingFileOff = new Map<string, number>();
        channel.onmessage = (event) => {
            const data = event.data;
            if(data instanceof ArrayBuffer){
                const dataArr = new Uint8Array(data);
                const fileIdArr = dataArr.subarray(0, 16);
                let fileId = ''
                for(let i = 0; i < 16; i++){
                    let hex = fileIdArr[i].toString(16);
                    if(hex.length === 1){
                        hex = hex.padStart(2, '0');
                    }
                    fileId += hex;
                }
                const requiredData = dataArr.slice(16, dataArr.length);
                const reqDataLen = requiredData.length
                const fileName = receivingFileNames.get(fileId);
                if(!fileName){
                    return
                }
                const prevOff = receivingFileOff.get(fileName) ?? 0;
                const newOffset = prevOff + requiredData.length;
                receivingFileOff.set(fileName, newOffset)
                const meta = {
                    fileName,
                    state: 'chunk',
                    offset: prevOff
                }
                const obj = {type: 'ack', amount: requiredData.length, fileId: fileId}
                const ackJson = JSON.stringify(obj)
                opfsWorker.postMessage({meta, stream: requiredData.buffer}, [requiredData.buffer])
                channel.send(ackJson);
                useFileStore.getState().updateProgress({name: fileName ? fileName : "", amount: reqDataLen})
            } else if(typeof data === 'string') {
                const message = JSON.parse(data);
                const fileId = message.fileId;
                if(message.type === "meta"){ 
                    const fileExists = receivingFileNames.get(fileId);
                    if(!fileExists){
                        receivingFileNames.set(fileId, message.fileName);
                        receivingFileOff.set(message.fileName, 0)
                    }
                }
                else if(message.type === 'ack'){
                    const fileName = useFileStore.getState().filesToSendMap.get(message.fileId);
                    if(fileName){
                        useFileStore.getState().updateProgressSending({name: fileName, amount: message.amount})
                    }
                }
                else if(message.type === "done"){
                    // const chunks = receivingFilesChunks.get(message.fileId);
                    // const file = new Blob(chunks);
                    // receivingFilesChunks.delete(fileId);
                    const meta = {state: 'done', fileName: message.fileName, offset: 0};
                    const stream = new ArrayBuffer();
                    const msg = {meta, stream}
                    opfsWorker.postMessage(msg)
                    receivingFileNames.delete(fileId)
                    receivingFileOff.delete(message.fileName)
                    this.onFileReceived(message.fileName, peerId);
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
    public async sendFile(peerId: string, {file, id}:{file:File, id:FileId}){
        const channel = this.dataChannels.get(peerId);
        if(!channel || channel.readyState !== "open"){
            return;
        }
        channel.send(JSON.stringify({type:"meta", fileName:file.name, fileId: id.originalHex, totalSize: file.size}));
        let offset = 0;
        const chunk_size = 16 * 1024
        while(offset < file.size){ 
            const currData = file.slice(offset, offset + chunk_size);
            const payload = await currData.arrayBuffer();
            const packet = new Uint8Array(id.byteArray.length + payload.byteLength)
            const payarr = new Uint8Array(payload);
            packet.set(id.byteArray, 0);
            packet.set(payarr, id.byteArray.length)
            while(channel.bufferedAmount > 128 * 1024){
                await new Promise(resolve => setTimeout(resolve, 10))
            }
            channel.send(packet.buffer)
            offset += chunk_size
        }
        channel.send(JSON.stringify({type:"done", fileId: id.originalHex, fileName: file.name}))
    }
    public broadcastFile({file, id}:{file:File, id: FileId}){
        for(const peerId of this.dataChannels.keys()){
            this.sendFile(peerId, {file, id});
        }
    }
    public getPeers(){
        return [...this.peers.keys()]
    }
}

