import { useEffect, useState } from "react"
import { useFileStore } from "../hooks/useFileStore"
import UploadedFile from "./UploadedFile"

type fileMeta = {
    fileId: string,
    totalSize:number,
    fileName: string,
    fileType: string,
}
type outgoingMsg = {
    from: string,
    text: string,
    file: fileMeta[]
}

const OutgoingBubble = ({from, text}:outgoingMsg) => {
    const {files, clearFiles} = useFileStore()
    const [filescpy, setfilescpy] = useState<File[]>([]);
    useEffect(() => {
        if(files.length > 0){
            setfilescpy(prev => [...prev, ...files])
            clearFiles()
        }
    },[])
    return(
    <div className="flex-col self-end flex mr-3 md:mr-46">
        <p className="text-white self-end p-3 text-md md:text-xl">{from}</p>
        <div className="text-sm  md:text-lg break-words break-all flex flex-col  p-3 max-w-52 md:max-w-3xl h-fit border border-gray-700 bg-black/55 text-white">
            <p>{text}</p>
            <div className="mt-2 space-y-2">
            {
                filescpy.length > 0 &&
                filescpy.map((file, index) => 
                    <UploadedFile key={index} file={file} name={file.name} type={file.type} />
                )
            }
            </div>
        </div>
    </div>
    )
}
export default OutgoingBubble