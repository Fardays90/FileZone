
const UploadedFile = ({ name, type } : {name:string, type:string} ) => {
    const icon = {
        audio: "🎵",
        video: "🎥",
        image: "📷",
        pdf: "📄",
        other: "📁"
    }[type] || "📁";
    return (
        <div className="flex flex-row items-center hover:scale-105 transition p-3 space-x-4 w-11/12 rounded-lg bg-black/35">
            <span className="text-3xl">{icon}</span>
            <span className="truncate   text-xl text-white">{name}</span>
        </div>
    );
};

export default UploadedFile