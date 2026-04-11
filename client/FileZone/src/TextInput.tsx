import {CircleXIcon, Paperclip, SendHorizontal } from "lucide-react";
import { useState } from "react"
import { useFileStore } from "../hooks/useFileStore";
import { useSocketStore } from "../hooks/useSocketStore";
import { useTextStore } from "../hooks/useTextStore";
import { usePeerStore } from "../hooks/usePeerStore";

type fileMeta = {
    fileId: string,
    fileName: string,
    totalSize: number,
    fileType: string,
}

// type incomingMsg = {
//     from: string,
//     text: string,
//     file: fileMeta[]
// }

// type message = {
//     type: string, //do 'msgText'
//     roomId: string,
//     msg: incomingMsg
// }


const TextInput = ({username} : {username: string}) => {
    const[text, setText] = useState<string>('');
    const{ PeerManager } = usePeerStore()
    const{ deleteFile, files, updateSendMap } = useFileStore();
    const{ socket, roomId } = useSocketStore();
    const{ setSentTexts } = useTextStore();

    function uuidToBytes(uuid: string){
        const req = uuid.replace(/-/g, '');
        const byteArr = new Uint8Array(16); // as uuid here is 32 hex characters after removing hyphens hence 16 bytes
        for(let i = 0; i < 16; i++){
            byteArr[i] = parseInt(req.substring(i * 2, (i * 2) + 2), 16);
        }
        return { originalHex:req, byteArray:byteArr };
    }

    const sendMessage = () => {
        setText('')
        let filesP: fileMeta[] = [];
        console.log('send clicked')
        if(files.length > 0){
            files.map((file) => {
                const idB = uuidToBytes(crypto.randomUUID())
                updateSendMap({id: idB.originalHex, name: file.name});
                filesP.push({
                    fileId: idB.originalHex, 
                    fileName: file.name, 
                    totalSize: file.size, 
                    fileType: 'other'
                })
                PeerManager?.broadcastFile({file, id: idB});
            })
        }
        const messagePayload = {
            from:username,
            text: text,
            file: filesP,
        }
        const build = {
            type: 'msgText',
            roomId: roomId,
            msg: messagePayload
        }
        console.log(messagePayload)
        socket?.send(JSON.stringify(build))
        setSentTexts(messagePayload)
    }
    return (
        <div className="flex flex-col bg-black/35 backdrop-blur-lg w-full   border md:w-3/4 ">
            {files.length > 0 &&
             <div className="flex flex-col max-h-20 space-y-2 overflow-y-auto w-full p-4 bg-black/35">
                {
                    files.map((file, index) => (
                        <div key={index} className="bg-gray-900/15 border border-gray-700 p-3   flex flex-row justify-between" >
                            <p className="text-white text-sm">{file.name}</p>
                            <button onClick={() => deleteFile(file.name)}>
                                <CircleXIcon color="white" />
                            </button>
                        </div>
                    ))
                }
             </div>
            }
            <div className="flex flex-row justify-between w-full backdrop-blur-lg bg-black/35  mb-10  p-4">
                <input id="inputto" onKeyDown={(e) => {if(e.key ==='Enter'){sendMessage()}}} onChange={(e) => {setText(e.target.value)}} value={text} placeholder="Aa" className="text-white hover:bg-black/55 focus:ring-lime-700 transition-all  focus:outline-none w-full p-3 bg-gray-900/15 border border-gray-700  focus:ring-2"/>
                <div className="flex flex-row space-x-2 ml-5">
                    <button onClick={() => sendMessage()} className="p-3 border border-gray-700 md:bg-black/15 md:hover:bg-black/85 cursor-pointer hover:scale-110">
                        <SendHorizontal color="white" />
                    </button>
                    <label htmlFor="inputFile" className="p-3 border border-gray-700 cursor-pointer hover:scale-110">
                        <Paperclip color="white" />
                    </label>
                </div>
            </div>
        </div>
    )
}

export default TextInput