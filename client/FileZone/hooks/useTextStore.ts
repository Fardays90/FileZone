import {create} from 'zustand'
import { useFileStore } from './useFileStore'
type fileMeta = {
    fileId: string,
    totalSize: number,
    fileName: string,
    fileType: string,
}
type outgoingMsg = {
    from: string,
    text: string,
    file: fileMeta[]
}

type incomingMsg = {
    from: string,
    text: string,
    file: fileMeta[]
}
type text = {
    type: string,
    body: incomingMsg | outgoingMsg
}
type props = {
    receivedTexts: incomingMsg[],
    sentTexts: outgoingMsg[],
    allTexts: text[]
    setSentTexts: (msg: outgoingMsg) => void
    setReceivedTexts: (msg: incomingMsg) => void
    updateAll: (msg: text) => void
}
const useTextStore = create<props>((set, get) => ({
    receivedTexts: [],
    sentTexts: [],
    allTexts: [],
    updateAll: (msg: text) => {
        set((state) => ({allTexts: [...state.allTexts, msg]}))
    },
    setSentTexts: (msg: outgoingMsg) => {
        const fn =  get().updateAll;
        fn({type:'sent', body: msg})
        for(const filex of msg.file){
            console.log('in sent text we have: '+filex.fileName)
        }
        set((state) => ({sentTexts: [...state.sentTexts, msg]}));
    },
    setReceivedTexts: (msg: incomingMsg) => {
        const fn =  get().updateAll;
        if(msg.file.length > 0){
            for(const file of msg.file){
                useFileStore.getState().addToReceive({name: file.fileName, totalSize: file.totalSize})
                useFileStore.getState().updateRecMap({name: file.fileName, id: file.fileId})
            }
        }
        fn({type:'incoming', body: msg})
        set((state) => ({receivedTexts: [...state.receivedTexts, msg]}))
    }
}))

export { useTextStore }