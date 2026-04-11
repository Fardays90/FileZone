import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react";
import { useSocketStore } from '../hooks/useSocketStore';
import { useNavigate } from "react-router-dom";
const Home = () => {
  const router = useNavigate();
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const { connect } = useSocketStore();
  const sectionsRef = useRef<HTMLDivElement>(null);

  const handleRoomId = (text: string) => {
    setCurrentRoomId(text);
  }

  useEffect(() => {
    async function pingServer() {
      const response = await fetch("http://localhost:8080/wake");
      console.log('pinging');
      if (response.status !== 200) {
        pingServer();
      } else {
        return;
      }
    }
    pingServer();
  }, []);

  const handleJoin = () => {
    if (currentRoomId) {
      connect(currentRoomId);
      router('/room')
    }
  }

  return (
    <div className="bg-black min-h-screen w-full overflow-y-auto">
      <div className="h-screen w-full flex flex-col justify-center items-center relative">
        <motion.div
          className="absolute inset-0  pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 49%, #065f46 49%, #e5e7eb 51%, transparent 51%),
              linear-gradient(-45deg, transparent 49%, #065f46 49%, #065f46 51%, transparent 51%)
            `,
            backgroundSize: "40px 40px",
            WebkitMaskImage:
                  "radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)",
                maskImage:
                  "radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full border border-emerald-500/40 bg-emerald-500/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-emerald-300 text-xs font-medium tracking-wide uppercase">
              P2P Secure File Sharing
            </span>
          </motion.div>
        <div className="flex flex-col items-center  w-max space-y-4 bg-black/2 backdrop-blur-sm p-8 shadow-md z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-8 md:mb-4">
            FileZone
          </h1>
          <input
            className="w-56 text-base md:text-lg md:w-80 px-4 py-2  border border-gray-700 focus:outline-none focus:ring-2 focus:ring-transparent bg-gray-900/15 text-white placeholder-gray-400 transition"
            placeholder="Enter a Room ID"
            value={currentRoomId}
            onChange={(e) => handleRoomId(e.target.value)}
          />

          <button
            className="w-56 md:w-80 px-4 py-2 rounded-lg bg-black cursor-pointer  text-white font-semibold hover:opacity-90 transition"
            onClick={handleJoin}
          >
            <p className="md:text-lg text-base">Join Room</p>
          </button>
        </div>
        <motion.div
          className="absolute bottom-20 md:bottom-8 flex flex-col items-center gap-1 text-gray-200 text-xs cursor-pointer z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{duration: 0.8 }}
          onClick={() => sectionsRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          <span className="tracking-widest uppercase md:text-sm text-[10px]">Learn more</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
      <div ref={sectionsRef} className="relative w-full">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-700/40 to-transparent" />
        <section
          className="w-full flex justify-center px-6 py-5 mt-10 md:py-10 md:mt-10"
        >
          <div className="max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-emerald-500/20 border border-lime-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">Guide</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-8 leading-tight">
              How to use FileZone?
            </h2>

            <div className="flex flex-col gap-6">
              {[
                {
                  step: "01",
                  text: "Enter any Room ID of your choice to create or join a room.",
                  color: "text-emerald-400",
                  border: "border-lime-500/20",
                  bg: "bg-lime-500/5",
                },
                {
                  step: "02",
                  text: "Send this Room ID to the person you want to share files with.",
                  color: "text-emerald-400",
                  border: "border-lime-500/20",
                  bg: "bg-lime-500/5",
                },
                {
                  step: "03",
                  text: "Wait for them to join. Once they're in, you can chat and send files directly no middleman.",
                  color: "text-emerald-400",
                  border: "border-lime-500/20",
                  bg: "bg-green-500/5",
                },
              ].map(({ step, text, color, border, bg }) => (
                <div key={step} className={`flex gap-4 items-start p-4 border ${border} ${bg}`}>
                  <span className={`text-2xl font-black ${color} leading-none mt-0.5 min-w-[2rem]`}>{step}</span>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          className="w-full flex flex-row justify-center bg-gradient-to-b from-black to-emerald-800 px-6 py-20 md:py-28"
        >
          <div className="max-w-2xl w-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-emerald-400 text-xs font-semibold tracking-widest uppercase">About</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight">
              What is FileZone?
            </h2>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              FileZone is a way to securely share any sort of media or file to a person directly
              <span className="text-white font-medium"> without a server in the middle</span>.
              Your files travel peer-to-peer, meaning only you and the recipient ever touch the data.
              It's secure, private, and faster in many cases than traditional upload-and-download services.
            </p>
          </div>
        </section>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        <div className="w-full flex justify-center py-8">
          <p className="text-gray-200 text-xs tracking-widest uppercase">FileZone Secure P2P Transfers</p>
        </div>
      </div>
    </div>
  )
}

export default Home;