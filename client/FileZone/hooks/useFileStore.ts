import { create } from 'zustand'
type fileStore = {
    files: File[],
    addFile: (file: File) => void,
    deleteFile: (name: string) => void
    clearFiles: () => void
}

export const useFileStore = create<fileStore>((set, get) => ({
    files: [],
    addFile: (file) => {
        const newArray = get().files
        newArray.push(file);
        set({files: newArray})
    },
    deleteFile: (name) => {
        const deletedFileArray = get().files.filter((file) => file.name !== name)
        set({files: deletedFileArray})
    },
    clearFiles: () => {
        set({files: []})
    }
}));
