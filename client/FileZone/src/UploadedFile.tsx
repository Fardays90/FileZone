import 'lucide-react'
import { TrashIcon } from 'lucide-react';
import { useFileStore } from '../hooks/useFileStore';
import { useEffect, useState } from 'react';
import clsx from 'clsx';


const UploadedFile = ({ name, type, file } : {name:string, type:string, file: File} ) => {
    const icon = {
        audio: "🎵",
        "video/mp4": "🎥",
        "image/jpeg": "📷",
        "image/png": "📷",
        "text/plain": "📄",
        other: "📁"
    }[type] || "📁";
    const {deleteFile, progressForSending} = useFileStore();
    const[prog, setProg] = useState<number>(0);
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
        const val = progressForSending.get(name);
        if((val !== undefined)){
            console.log('setting progress for '+file.name+' to '+val)
            setProg(val)

        }
    },[progressForSending])
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
        <div className="flex flex-row items-center transition p-3 justify-between space-x-4 w-11/12 rounded-lg bg-black/35">
            <div className='flex flex-col h-full justify-between'>
                <div className='flex flex-row space-x-2 md:space-x-5 mt-5  items-center text-white'>
                    <span className="text-xl">{icon}</span>
                    <span className="truncate  text-sm md:text-xl">{shortenedName}</span>
                </div>
                { prog !== 0 &&
                <div className='flex flex-col'>
                    <span className='w-80 h-2 rounded-lg flex items-center bg-white z-10'>
                        <div className={clsx('h-2 rounded z-50 bg-green-500')} style={{width: prog+`%`}}/>
                    </span>
                </div>
                }
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