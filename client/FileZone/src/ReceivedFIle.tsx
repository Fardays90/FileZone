import 'lucide-react'
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';


const ReceivedFile = ({ name, type, file } : {name:string, type:string, file: Blob} ) => {
    const icon = {
        audio: "🎵",
        "video/mp4": "🎥",
        "image/jpeg": "📷",
        "image/png": "📷",
        "text/plain": "📄",
        other: "📁"
    }[type] || "📁";
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [shortenedName, setShortenedName] = useState<string | null>(null);
    useEffect(() => {
            const newURL = URL.createObjectURL(file);
            setPreviewURL(newURL)
            return () => URL.revokeObjectURL(newURL);
    }, [file, type]);
    useEffect(() => {
        if(name.length > 11){
            const newString = name.slice(0, 11)
            setShortenedName(newString)
        }
        else{
            setShortenedName(name);
        }
    },[name])
    return (
        <div className="flex flex-row items-center hover:scale-105 transition p-3 justify-between space-x-4 w-11/12 rounded-lg bg-black/35">
            <div className='flex flex-row space-x-2 md:space-x-5 items-center'>
                <span className="text-xl">{icon}</span>
                <span className="truncate  text-sm md:text-xl text-white">{shortenedName}</span>
            </div>
            {
                 previewURL &&
                <div className=' flex flex-row items-center space-x-4'>
                    <img src={previewURL} className='h-16 md:h-20 rounded-lg'/>
                    <a href={previewURL} download={name} style={{cursor:'pointer'}} className='bg-lime-600 rounded-xl p-2'>
                        <Download color='white'/>
                    </a>
                </div>
            }
        </div>
    );
};

export default ReceivedFile