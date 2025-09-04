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
            const response = await fetch("https://filezone.fardays.com/wake");
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
                className="absolute inset-0 blur-[150px] pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.7), transparent 40%),
                                radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.6), transparent 50%),
                                radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.5), transparent 60%)`
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                />
            <div className="flex flex-col items-center w-max space-y-4 bg-black/45 backdrop-blur-lg p-8 rounded-2xl shadow-pink-700 shadow-md z-10">
                <h1 className="text-3xl  md:text-5xl font-extrabold text-white tracking-tight mb-8 md:mb-4">
                FileZone
                </h1>
                <input
                className="w-56 text-base md:text-lg md:w-80 px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700 bg-gray-900/15 text-white placeholder-gray-400 transition"
                placeholder="Enter a Room ID"
                value={currentRoomId}
                onChange={(e) => handleRoomId(e.target.value)}
                />
                <button
                className="w-56 md:w-80 px-4 py-2 rounded-lg bg-gradient-to-r backdrop-blur-lg  from-blue-500/15 to-purple-500/15 text-white font-semibold hover:opacity-90 transition"
                onClick={handleJoin}
                >
                <p className="md:text-lg text-base">Join Room</p>
                </button>
            </div>
        </div>
    )
}

export default Home;