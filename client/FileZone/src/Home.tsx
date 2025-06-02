import { motion } from "framer-motion"
import { useEffect, useState } from "react";
import {useSocketStore} from '../hooks/useSocketStore';
import { useNavigate } from "react-router-dom";
const Home = () => {
    const router = useNavigate();
    const[currentRoomId, setCurrentRoomId] = useState<string>('');
    const { connect } = useSocketStore();
    const handleRoomId = (text: string) => {
        setCurrentRoomId(text);
    }
    useEffect(() => {
        async function pingServer(){
            const response = await fetch("https://filezone-lg50.onrender.com/wake");
            // const response = await fetch("http://localhost:8080/wake");
            console.log('pinging');
            if(response.status !== 200){
                pingServer();
            }
            else{
                return;
            }
        }
        pingServer();
    },[]);
    const handleJoin = () => {
        if(currentRoomId){
            connect(currentRoomId);
            router('/room')
        }
    }
    return (
        <div className="bg-black h-screen w-screen flex flex-col justify-center items-center">
            <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 blur-3xl"
            initial={{opacity:0}}
            animate={{opacity:0.7}}
            transition={{duration:1.5}}
            />
            <div className="flex flex-col items-center gap-6 bg-black/45 backdrop-blur-lg p-8 rounded-2xl shadow-pink-700 shadow-md z-10">
                <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
                FileZone
                </h1>
                <input
                className="w-80 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900/15 text-white placeholder-gray-400 transition"
                placeholder="Enter a Room ID"
                value={currentRoomId}
                onChange={(e) => handleRoomId(e.target.value)}
                />
                <button
                className="w-80 px-4 py-2 rounded-lg bg-gradient-to-r  from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition"
                onClick={handleJoin}
                >
                Join Room
                </button>
            </div>
        </div>
    )
}

export default Home;