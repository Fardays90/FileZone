import 'lucide-react'
import { TrashIcon } from 'lucide-react';
import { useFileStore } from '../hooks/useFileStore';
import { useEffect, useState } from 'react';


const UploadedFile = ({ name, type, file } : {name:string, type:string, file: File} ) => {
    const icon = {
        audio: "🎵",
        "video/mp4": "🎥",
        "image/jpeg": "📷",
        "image/png": "📷",
        "text/plain": "📄",
        other: "📁"
    }[type] || "📁";
    const {deleteFile} = useFileStore();
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [shortenedName, setShortenedName] = useState<string | null>(null);
    useEffect(() => {
        if (type.includes('image') && file !== undefined){
            const newURL = URL.createObjectURL(file);
            setPreviewURL(newURL)
            return () => URL.revokeObjectURL(newURL);
        }
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
                type.includes('image') && previewURL ?
                <div className=' flex flex-row items-center space-x-4'>
                    <img src={previewURL} className='h-16 md:h-20 rounded-lg'/>
                    <button onClick={() => deleteFile(name)} style={{cursor:'pointer'}} className='bg-rose-500 rounded-xl p-2'>
                        <TrashIcon color='white'/>
                    </button>
                </div>
                :
                <button onClick={() => deleteFile(name)} style={{cursor:'pointer'}} className='bg-rose-500 rounded-xl p-2'>
                        <TrashIcon color='white'/>
                </button>
            }
        </div>
    );
};

export default UploadedFile