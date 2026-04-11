import { create } from 'zustand'
type filesTransit = {
    name: string,
    totalSize: number
}
type fileToID = {
    name: string,
    id: string,
}
type progressData = {
    name: string,
    amount: number
}
type receivedFile = {
    file: Blob,
    fileName: string,
    from: string
}
type fileStore = {
    files: File[],
    filesToReceive: filesTransit[],
    filesDoneReceiving: receivedFile[],
    filesToSend: filesTransit[],
    filesToSendMap: Map<string, string>,
    progress: Map<string, number>,
    progressForSending: Map<string, number>
    filesToId: Map<string, string>
    filesRecToId: Map<string, string>
    filesToRecMap: Map<string, string>,
    addFile: (file: File) => void,
    deleteFile: (name: string) => void
    clearFiles: () => void,
    clearSend: (filesTransit: filesTransit) => void,
    addToReceive: (fileTransit: filesTransit) => void,
    addToSend: (fileTransit: filesTransit) => void,
    addToDoneRec: (payload: receivedFile) => void,
    updateProgressSending: (progData: progressData) => void,
    updateProgress: (progData: progressData) => void,
    updateSendMap: (meta: fileToID) => void,
    updateRecMap: (meta: fileToID) => void,
    clearReceive: (filesTransit: filesTransit) => void,
}
export const useFileStore = create<fileStore>((set, get) => ({
    files: [],
    filesToReceive: [],
    filesToSend: [],
    filesDoneReceiving: [],
    progressForSending: new Map<string, number>(),
    progress: new Map<string, number>(),
    filesToSendMap: new Map<string, string>(),
    filesToRecMap: new Map<string, string>(),
    filesRecToId: new Map<string, string>(),
    filesToId: new Map<string, string>(),
    updateProgressSending: (progD: progressData) => {
        const files = get().filesToSend;
        const file = files.find((elem) => elem.name === progD.name);
        const progressMap = get().progressForSending;
        if(file){
            const size = file.totalSize;
            const prevProg = progressMap.get(progD.name);
            const newProg = prevProg ? ((prevProg / 100) * file.totalSize) + progD.amount : progD.amount;
            const progress = ((newProg / size) * 100);
            // console.log(`For file: ${file.name} previous progress:`+prevProg+`\n New Prog: `+newProg+`\n In percentage: `+progress)
            if(progress >= 100){
                get().clearSend(file);
                set({progressForSending: new Map(progressMap.set(file.name, 100))})
            } else {
                const newProg = new Map(progressMap).set(file.name,progress);
                set({progressForSending: newProg});
            }
        }
    },
    updateProgress: (progD: progressData) => {
        const currProg = get().progress;
        const currentFilesTransit = get().filesToReceive;
        const reqFile = currentFilesTransit.find((elem) => elem.name == progD.name);
        // console.log('dfkjsdkjfdskjf file name in update progress: ',reqFile)
        const totalSize = reqFile?.totalSize;
        if(reqFile && totalSize && totalSize > 0){
            const prev = currProg.get(progD.name);
            const newAmount = prev ? (((prev / 100) * reqFile.totalSize) + progD.amount) : progD.amount;
            const newProgPercent = ((newAmount / reqFile.totalSize) * 100);
            // console.log(`For file: ${reqFile.name} previous progress:`+prev+`\n New Prog: `+newProg+`\n In percentage: `+newProgPercent)
            if(newProgPercent >= 100){
                get().clearReceive(reqFile)
                // console.log('hoi hoi hoi: '+File)
                set({progress: new Map(currProg.set(reqFile.name, 100))})
            } else {
                set({progress: new Map(currProg).set(reqFile.name, newProgPercent)})
            }
        }
    },
    addToDoneRec: (payload: receivedFile) => {
        set((state) => ({filesDoneReceiving: [...state.filesDoneReceiving, payload]}))
    },
    clearSend: (fileTransit: filesTransit) => {
        const currentFiles = get().filesToSend;
        const newFiles = currentFiles.filter((elem) => elem.name !== fileTransit.name);
        set({filesToSend: newFiles});
    },
    clearReceive: (fileTransit: filesTransit) => {
        const currentFilesTransit = get().filesToReceive;
        const newArr = currentFilesTransit.filter((elem) => elem.name !== fileTransit.name);
        set({filesToReceive: newArr});
    },
    updateSendMap: (meta : fileToID) => {
        set({filesToSendMap: new Map(get().filesToSendMap).set(meta.id, meta.name)});
        set({filesToId: new Map(get().filesToId).set(meta.name, meta.id)})
    },
    updateRecMap: (meta: fileToID) => {
        set({filesToRecMap: new Map(get().filesToRecMap).set(meta.id, meta.name)});
        set({filesRecToId: new Map(get().filesRecToId).set(meta.name, meta.id)})
    },
    addToSend: (fileTransit: filesTransit) => {
        const currentProg = get().progressForSending;
        const newMap = new Map(currentProg).set(fileTransit.name, 0);
        set((state) => ({filesToSend: [...state.filesToSend, fileTransit], progressForSending: newMap}))
    },
    addToReceive: (fileTransit: filesTransit) => {
        // const currentProgress = get().progress;
        // const newMap = new Map(currentProgress).set(fileTransit.name, 0);
        set((state) => ({filesToReceive: [...state.filesToReceive, fileTransit]}));
    },
    addFile: (file) => {
        set((state) => ({files: [...state.files, file]}));
    },
    deleteFile: (name) => {
        const deletedFileArray = get().files.filter((file) => file.name !== name)
        set({files: deletedFileArray})
    },
    clearFiles: () => {
        set({files: []})
    }
}));
