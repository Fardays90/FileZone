import 'lucide-react'
import { DeleteIcon, TrashIcon } from 'lucide-react';
import { useFileStore } from '../hooks/useFileStore';


const UploadedFile = ({ name, type } : {name:string, type:string} ) => {
    const icon = {
        audio: "🎵",
        video: "🎥",
        "image/jpeg": "📷",
        "image/png": "📷",
        pdf: "📄",
        other: "📁"
    }[type] || "📁";
    const {deleteFile} = useFileStore();
    return (
        <div className="flex flex-row items-center hover:scale-105 transition p-3 justify-between space-x-4 w-11/12 rounded-lg bg-black/35">
            <div className='flex flex-row space-x-5 items-center'>
                <span className="text-3xl">{icon}</span>
                <span className="truncate   text-xl text-white">{name}</span>
            </div>
            <button onClick={() => deleteFile(name)} style={{cursor:'pointer'}} className='bg-rose-500 rounded-xl p-2'>
                <TrashIcon color='white' className=''  />
            </button>
        </div>
    );
};

export default UploadedFile