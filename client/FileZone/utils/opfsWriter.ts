/// <reference lib="webworker" />
type meta = {
    fileName: string,
    offset: number
    state: string
}
const handles = new Map<string, FileSystemSyncAccessHandle>();
const pending = new Map<string, Promise<FileSystemSyncAccessHandle>>();
self.onmessage  = async ({ data }) => {
    const {meta, stream}: {meta: meta, stream: ArrayBuffer} = data;
    if(meta.state === 'chunk'){
        if(!handles.has(meta.fileName) && !pending.has(meta.fileName)){
            const createHandle = async () => {
                const opfsRoot = await navigator.storage.getDirectory();
                const fd = await opfsRoot.getFileHandle(meta.fileName, {create: true});
                const handle = await fd.createSyncAccessHandle();
                handles.set(meta.fileName, handle);
                return handle;
            }
            const prom = createHandle();
            pending.set(meta.fileName, prom)
        }
        if(pending.has(meta.fileName)){
            await pending.get(meta.fileName)
            pending.delete(meta.fileName)
        }
        let handle = handles.get(meta.fileName);
        handle?.write(new Uint8Array(stream), {at: meta.offset});
    }
    if(meta.state === 'done'){
        handles.get(meta.fileName)?.flush();
        handles.get(meta.fileName)?.close();
        handles.delete(meta.fileName);
        const doneMessage = {type:'done', fileName: meta.fileName}
        self.postMessage(doneMessage)
    }
}