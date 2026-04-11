import { useSocketStore } from "../hooks/useSocketStore"
import { usePeerStore } from '../hooks/usePeerStore';
import {AnimatePresence, easeInOut, motion} from 'framer-motion'
import { AlertCircle,User, XIcon } from "lucide-react";
import { useFileStore } from '../hooks/useFileStore';
import { useEffect, useRef, useState } from "react";
import {useTextStore} from '../hooks/useTextStore'
import clsx from "clsx";
import IncomingBubble from "./IncomingBubble";
import OutgoingBubble from "./OutgoingBubble";
import TextInput from "./TextInput";
import { useNavigate } from "react-router-dom";

type receivedFile = {
    file: Blob,
    fileName: string,
    from: string
}
type fileMeta = {
    fileId: string,
    totalSize: number,
    fileName: string,
    fileType: string,
}

type incomingMsg = {
    from: string,
    text: string,
    file: fileMeta[]
}

const Room = () => {
    const {roomId, socket, state} = useSocketStore();
    const { PeerManager, setNewPeerManager } = usePeerStore();
    const [username, setUsername] = useState('')
    const [users, setUsers] = useState<any[]>([]);
    const [userModal, setUserModal] = useState<boolean>(false);
    const [alert, setAlert] = useState<string>('');
    const [justJoined, setJustJoined] = useState(true);
    const alertTimeoutRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [receivedModal, setReceivedModal] = useState(false);
    const router = useNavigate();
    const [receivedFiles] = useState<receivedFile[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainer = useRef<HTMLDivElement>(null)
    const {files, addFile, clearFiles, addToSend} = useFileStore();
    const{ setReceivedTexts, allTexts } = useTextStore();
    
    useEffect(() => {
        if(PeerManager === null  && username && socket && roomId){
            setNewPeerManager(socket, username, roomId, (fileName: string, from: string) => {
                // const receivedObj = {fileName: fileName, from: from}
                // addToDoneRec(receivedObj)
                console.log(`${fileName} has been successfully received from ${from} in OPFS`)
            });
        }
    },[roomId, username, socket]);
    useEffect(() => {
        if(state === false){
            router('/')
        }
    },[state])

    useEffect(() => {
        if(users.length === 1){
            setJustJoined(false);
        }
        if(justJoined && PeerManager !== null && users.length > 1 && username && roomId && socket){
            users.forEach((user) => {
                if(username !== user){
                    PeerManager.connectToPeer(user)
                }
            })
            setJustJoined(false);
        }
    },[PeerManager, roomId,username, users, justJoined])
    useEffect(() => {
        if(scrollContainer.current){
            scrollContainer.current.scrollTo({
                top: scrollContainer.current.scrollHeight,
                behavior: "auto"
            })
        }
    },[allTexts])
    useEffect(() => {
        if(!socket)return;
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            switch (data.type){
                case "username":
                    console.log('got username: '+data.username)
                    setUsername(data.username);
                    break
                case "usernames":
                    console.log('got usernames: '+data.usernames)
                    setUsers(data.usernames);
                    break;
                case "candidate":
                    console.log("Got ICE candidate for "+username+" from "+data.sender);
                    if(!PeerManager){
                        console.log('Peer manager is null')
                    }
                    else{
                        PeerManager.handleSignal(data)
                    }
                    break;
                case "offer":
                    console.log('got offer: ',data)
                    if(!PeerManager){
                        console.warn("Peer manager is null")
                    }else{
                        PeerManager?.handleSignal(data)
                    }
                    break;
                case "answer":
                    console.log('got answer: ',data)
                    if(!PeerManager){
                        console.warn("Peer manager is null")
                    }else{
                        PeerManager?.handleSignal(data)
                    }
                    break;
                case "msgText":
                    const msgData: incomingMsg = data.msg
                    let files = msgData.file
                    const build = {from: msgData.from, text: msgData.text, file: files}
                    setReceivedTexts(build)
                    break;
                case "intent":
                    
                    break;
                case "alert":
                    setAlert(data.message)
                    if(data.message.includes("joined")){
                        console.log('just joined to false')
                    }
                    if(alertTimeoutRef.current){                
                        clearTimeout(alertTimeoutRef.current)
                    }
                    alertTimeoutRef.current = setTimeout(() => {
                        setAlert('');
                        alertTimeoutRef.current = null;
                    }, 3000)
                    break;
            }
        }
        return () => {
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
            }
        };
        }, [PeerManager])

    // const sendFiles = () => {
    //     console.log('send clicked')
    //     if(files.length > 0){
    //         console.log('trying to send')
    //         files.map((file) => {
    //             PeerManager?.broadcastFile(file);
    //         })
    //     }
    // }

    useEffect(() => {
        if(inputRef.current){
            inputRef.current.onchange = () => {
                const files = inputRef.current?.files;
                const emptyArr: File[] = new Array()
                if(files){
                    for(let i = 0; i < files.length; i++){
                        emptyArr[i] = files[i];
                    }
                }
                console.log('new selected files');
                console.log(emptyArr);

                emptyArr.map((file) => {
                    const obj = {name: file.name, totalSize: file.size}
                    addToSend(obj);
                    addFile(file);
                })
            }
        }
    }, []);
    const handleUserClicked = () => {
        setUserModal((prev) => !prev)
    }
    
    return(
        <div className="flex flex-col bg-black  h-screen w-screen">
             <motion.div
                className="absolute inset-0  bg-black pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{backgroundImage: `
                    linear-gradient(45deg, transparent 49%, #065f46 49%, #e5e7eb 51%, transparent 51%),
                    linear-gradient(-45deg, transparent 49%, #065f46 49%, #065f46 51%, transparent 51%)
                `,
                backgroundSize: "40px 40px",
                WebkitMaskImage:
                  "radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)",
                maskImage:
                  "radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)",}}
                transition={{ duration: 2 }}
                />
            <AnimatePresence>
            {
                alert &&
                    <motion.div className="w-full h-32 p-4 bg-black/20  backdrop-blur-md fixed top-0 bottom-auto flex flex-row space-x-5 items-center"
                    initial={{ x: -400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{opacity: 0 }}
                    transition={{ duration: 0.75, ease:easeInOut}}
                    key={alert}                   
                    style={{zIndex:9999}} 
                    >
                        <AlertCircle color="white" size={32}/>
                        <p className="text-white font-bold font-mono text-center">{alert}</p>
                    </motion.div>
            }
            </AnimatePresence>
            <AnimatePresence>
            {
                userModal &&
                <motion.div className="flex flex-col shadow-xl shadow-black absolute w-3/4 h-screen md:w-1/3 p-5 bg-black/30 space-y-5 py-10  backdrop-blur-md "
                initial={{x:-400}}
                animate={{x:0}}
                exit={{x:-650}}
                transition={{duration:0.3}}
                style={{zIndex:999999}}
                >
                    <p className="text-white text-sm md:text-xl font-light font-mono">Your username: {username}</p> 
                    <p className="text-white text-sm md:text-xl font-light font-mono">Users Connected: </p>
                    {
                        users.map((user:any, index:number) => (
                            <div key={index}>
                                <p className="text-white text-sm md:text-xl font-light font-mono">{index+1}. {user}</p>
                            </div>
                        ))
                    }
                </motion.div>
            }
            </AnimatePresence>
            <AnimatePresence>
                {
                    receivedModal &&
                    <motion.div
                    className="flex flex-col absolute w-full items-center  h-screen md:w-full p-5 bg-black/30 space-y-5 py-10  backdrop-blur-md"
                    initial={{y:-window.innerHeight}}
                    animate={{y:0}}
                    exit={{y:-window.innerHeight}}
                    transition={{duration:0.6}}
                    style={{zIndex:999999}}
                    >
                        <button onClick={() => setReceivedModal(false)} className="self-start cursor-pointer" >
                            <XIcon color="white" size={32}/>
                        </button>
                        <div className="flex-1 flex overflow-y-auto flex-col w-full items-center self-center p-3 space-y-5">
                            {
                                // (receivedFiles.length > 0) ?
                                // receivedFiles.map((file, index) => (
                                //     <ReceivedFile key={index} name={file.fileName} type={file.file.type} file={file.file}/>
                                // ))
                                // :
                                // <p>No files gotten yet</p>
                            }
                        </div>
                    </motion.div>
                }
            </AnimatePresence>
            <motion.div className="h-20  md:h-24  bg-black/65 0 shadow-md shadow-black mb-2 flex flex-row justify-between px-5 items-center w-screen relative z-50 top-0"
            initial={{y:-200}}
            animate={{y:0}}
            transition={{duration:0.75}}
            >
                <p className="text-white font-mono text-xl md:text-2xl ">{roomId}</p>
                <div className="flex flex-row space-x-8 md:pr-8">
                    {
                        receivedFiles.length > 0 && 
                        <button onClick={() => setReceivedModal((state) => !state)} style={{cursor:'pointer'}} className="rounded-xl shadow-md shadow-black bg-gradient-to-l  from-blue-500/15 to-rose-500/15 backdrop-blur-3xl hover:scale-110 transition-all">
                            <p className="p-4 text-white">Received files</p>
                        </button>
                    }
                    {
                        files.length > 0 &&
                        <button onClick={clearFiles} style={{cursor:'pointer'}} className="shadow-md bg-black/15 border border-gray-700  hover:scale-110 transition-all">
                            <p className="p-4 text-white">Clear</p>
                        </button>
                    }
                    <button onClick={handleUserClicked} style={{cursor:'pointer'}}>
                        <User size={32}  color={"#ffffff"} />
                    </button>
                </div>
            </motion.div>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-700/40 to-transparent" />
            <div ref={scrollContainer} className="flex-col flex-1 overflow-y-auto flex w-screen z-20 mb-30 md:mb-40 space-y-2 ">
                {
                    (files.length === 0) && (allTexts.length === 0) &&
                    <motion.p className="text-white font-bold text-xl md:text-3xl mx-auto my-auto "
                    initial={{opacity:0}}
                    animate={{opacity:1}}
                    transition={{duration:0.15}}
                    >
                    No files to show
                    </motion.p>
                }
                {
                    <>{
                    allTexts.length > 0 &&
                    allTexts.map((bubble, index) => (
                        bubble.type === 'sent' ?     
                        <OutgoingBubble key={index} from={bubble.body.from} text={bubble.body.text} file={bubble.body.file}/>
                        :
                        <IncomingBubble key={index} from={bubble.body.from} text={bubble.body.text} file={bubble.body.file}/>
                    ))}
                    <div ref={bottomRef}/>
                    </>
                }
            </div>
            <div className={clsx("w-full flex-row absolute z-50  justify-center flex bottom-0"
             ) }>
                {/* {
                    files.length < 0 &&
                    <>
                        <label htmlFor="inputFile"  className="rounded-xl  w-3/4 backdrop-blur-lg bg-black/35  hover:bg-black/55 md:mb-20 mb-10  p-4" style={{cursor:'pointer'}}>
                            <p className="text-white text-center text-sm md:text-xl font-bold">Add File</p>
                        </label>
                        <button onClick={sendFiles} className="rounded-xl  w-1/4 backdrop-blur-lg bg-black/35  hover:bg-black/55 md:mb-20 mb-10  p-4" style={{cursor:'pointer'}}>
                            <p className="text-white text-center text-sm md:text-xl font-bold">Send</p>
                        </button>
                    </>
                    :
                    <label htmlFor="inputFile"  className="rounded-xl  w-1/2 backdrop-blur-lg bg-black/35  hover:bg-black/55 md:mb-20 mb-10  p-4" style={{cursor:'pointer'}}>
                        <p className="text-white text-center text-sm md:text-xl font-bold">Add File</p>
                    </label>
                    <div className="">
                        {
                            files.map((file, index) => (
                            <UploadedFile key={index} file={file} name={file.name} type={file.type} />
                        ))
                        }
                    </div>
                } */}
                <TextInput username={username}/>
                <input id="inputFile" ref={inputRef} multiple type="file" className="hidden"/>
            </div>
        </div>
    )
}

export default Room