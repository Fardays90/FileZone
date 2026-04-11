import 'lucide-react'
import { useFileStore } from '../hooks/useFileStore';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Download } from 'lucide-react';


const ReceivedFile = ({ name, type } : {name:string, type:string} ) => {
    const icon = {
        "audio": "🎵",
        "video/mp4": "🎥",
        "image/jpeg": "📷",
        "image/png": "📷",
        "text/plain": "📄",
        "other": "📁"
    }[type] || "📁";

    const {progress, filesDoneReceiving} = useFileStore();
    const [prog, setProg] = useState<number>(0);
    const [typeo, setTypeo ] = useState('');
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [shortenedName, setShortenedName] = useState<string | null>(null);
    const [done, setDone] = useState(false)

    useEffect(() => {
        const val = progress.get(name);
        if((val !== undefined)){
            // console.log('setting progress for '+name+' to '+val)
            setProg(val)
            if(val >= 99.99){
                // console.log('entered here')
                const req = filesDoneReceiving.find((nFile, _) =>  name === nFile.fileName) //check
                if(req){
                    // console.log('entered hereo')
                    const url = URL.createObjectURL(req.file)
                    setPreviewURL(url)
                }
                setDone(true)
            }
        }
    },[progress, filesDoneReceiving])

    useEffect(() => {
        const extIndex = name.indexOf(".")
        const ext = name.slice(extIndex + 1)
        setTypeo(ext)
    },[])

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
        <div className="flex flex-row items-center transition p-3 justify-between space-x-4 mt-2 w-full rounded-lg bg-black/35">
            <div className='flex flex-col h-full justify-between'>
                <div className='flex flex-row space-x-2 md:space-x-5 mt-5  items-center text-white'>
                    <span className="text-lg">{icon}</span>
                    <span className="truncate  text-sm md:text-lg">{shortenedName}</span>
                </div>
                { prog !== 0 &&
                <div className='flex flex-col'>
                    <span className='w-80 h-2 mt-4 rounded-lg flex items-center bg-white z-10'>
                        <div className={clsx('h-2 rounded z-50 bg-green-500')} style={{width: prog+`%`}}/>
                    </span>
                </div>
                }
            </div>
            <div>
                {
                (previewURL && typeo && (typeo === 'png' || typeo === 'jpg' || typeo === 'jpeg' )) &&
                <img src={previewURL} className='h-16 md:h-20 rounded-lg'/>
                }
            </div>
            {
                (done && previewURL) &&
                <button style={{cursor:'pointer'}} className='bg-rose-500 w-max h-max rounded-xl p-2'>
                        <a href={previewURL} download={name}>
                        <Download />
                        </a>
                </button>
            }
        </div>
    );
};

export default ReceivedFile