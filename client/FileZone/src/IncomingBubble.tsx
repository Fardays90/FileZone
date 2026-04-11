import ReceivedFile from "./ReceivedFIle"

type fileMeta = {
    fileId: string,
    totalSize:number,
    fileName: string,
    fileType: string,
}
type incomingMsg = {
    from: string,
    text: string,
    file: fileMeta[]
}

const IncomingBubble = ({from, text, file}:incomingMsg) => {
    return(
    <div className="flex-col flex ml-3 md:ml-46">
        <p className="text-white p-3 text-md md:text-xl">{from}</p>
        <div className="flex flex-col w-fit min-w-sm text-sm md:text-lg max-w-2xl md:max-w-3xl p-3 break-all   border border-gray-700 bg-black/55 text-white">
            {text}
            {
            file.map((meta, index) => (
                <ReceivedFile key={index} name={meta.fileName} type={meta.fileType} />
            ))
        }
        </div>
    </div>
    )
}
export default IncomingBubble