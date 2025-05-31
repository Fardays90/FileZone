import { useSocketStore } from "../hooks/useSocketStore"
import { usePeerStore } from '../hooks/usePeerStore';
import {AnimatePresence, easeInOut, motion} from 'framer-motion'
import UploadedFile from "./UploadedFile";
import { AlertCircle, User } from "lucide-react";
import { useFileStore } from '../hooks/useFileStore';
import { InputHTMLAttributes, useEffect, useRef, useState } from "react";
const Room = () => {
    const {roomId, socket} = useSocketStore();
    const { PeerManager, setNewPeerManager } = usePeerStore();
    const [username, setUsername] = useState('')
    const [users, setUsers] = useState<any[]>([]);
    const [userModal, setUserModal] = useState<boolean>(false);
    const [alert, setAlert] = useState<string>('');
    const [justJoined, setJustJoined] = useState(false);
    const alertTimeoutRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null)
    const {files, addFile, clearFiles} = useFileStore();
    
    useEffect(() => {
        if(PeerManager === null  && username && socket && roomId){
            setNewPeerManager(socket, username, roomId, () => {});
        }
    },[roomId, username, socket]);
    useEffect(() => {
        if(justJoined && PeerManager !== null && users.length > 1 && username && roomId && socket){
            users.forEach((user) => {
                if(username !== user){
                    PeerManager.connectToPeer(user)
                }
            })
        }
    },[PeerManager, roomId,username, users, justJoined])

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
                case "justJoined":
                    setJustJoined(true);
                    break
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
                case "alert":
                    setAlert(data.message)
                    if(data.message.includes("joined")){
                        console.log('just joined to false')
                        setJustJoined(false);
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

    useEffect(() => {
        if(inputRef.current){
            inputRef.current.onchange = () => {
                const files = inputRef.current?.files;
                const emptyArr = new Array()
                if(files){
                    for(let i = 0; i < files.length; i++){
                        emptyArr[i] = files[i];
                    }
                }
                console.log('new selected files');
                console.log(emptyArr);
                emptyArr.map((file) => {
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
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl z-10"
            initial={{opacity:0.7}}
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
                initial={{x:-650}}
                animate={{x:0}}
                exit={{x:-650}}
                transition={{duration:0.6}}
                style={{zIndex:999999}}
                >
                    <p className="text-white text-sm md:text-xl font-light font-mono">Your username: {username}</p> 
                    <p className="text-white text-sm md:text-xl font-light font-mono">Users Connected: </p>
                    {
                        users.map((user:any, index:number) => (
                            <div key={index}>
                                <p className="text-white text-xl font-light font-mono">{index+1}. {user}</p>
                            </div>
                        ))
                    }
                </motion.div>
            }
            </AnimatePresence>
            <motion.div className="h-20  md:h-24  bg-black/65 shadow-md shadow-black mb-2 flex flex-row justify-between px-5 items-center w-screen relative z-50 top-0"
            initial={{y:-200}}
            animate={{y:0}}
            transition={{duration:0.75}}
            >
                <p className="text-white font-mono text-xl md:text-2xl ">{roomId}</p>
                <div className="flex flex-row space-x-8 md:pr-8">
                    {
                        files.length > 0 &&
                        <button onClick={clearFiles} style={{cursor:'pointer'}} className="rounded-xl shadow-md shadow-black bg-gradient-to-l  from-blue-500/15 to-rose-500/15 backdrop-blur-3xl hover:scale-110 transition-all">
                            <p className="p-4 text-white">Clear</p>
                        </button>
                    }
                    <button onClick={handleUserClicked} style={{cursor:'pointer'}}>
                        <User size={32}  color={"#ffffff"} />
                    </button>
                </div>
            </motion.div>
            <div className="flex-col flex-1 overflow-y-auto flex w-screen z-20 items-center mb-24 md:mb-36 space-y-2 ">
                {
                    files &&
                    files.map((file, index) => {
                        console.log('file type: '+file.type)
                        return(
                            <UploadedFile key={index} file={file} name={file.name} type={file.type} />
                        )
                    })
                    
                }
                {
                    files.length === 0 &&
                    <motion.p className="text-white font-bold text-xl md:text-3xl mx-auto my-auto "
                    initial={{opacity:0}}
                    animate={{opacity:1}}
                    transition={{duration:0.15}}
                    >
                    No files to show
                    </motion.p>
                }
            </div>
            <div className="w-full  flex-row  absolute z-50 justify-center  flex bottom-0 ">
                <label htmlFor="inputFile"  className="rounded-xl  w-1/2 backdrop-blur-lg bg-black/35  hover:bg-black/55 md:mb-20 mb-10  p-4" style={{cursor:'pointer'}}>
                    <p className="text-white text-center text-sm md:text-xl font-bold">Add File</p>
                </label>
                <input id="inputFile" ref={inputRef} multiple type="file" className="hidden"/>
            </div>
        </div>
    )
}

export default Room