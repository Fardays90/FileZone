self.addEventListener('fetch', (e) => {
    console.log('hola')
    const url = new URL(e.request.url);
    if(url.pathname.startsWith('/download/')){
        e.respondWith(handleDownload(url));
    }
}) 
const handleDownload = async (url) => {
    const pathName = url.pathname;
    const idx = pathName.lastIndexOf('/')
    const fileName = decodeURIComponent(pathName.substring(idx + 1))
    const opfsRoot = await navigator.storage.getDirectory();
    const fd = await opfsRoot.getFileHandle(fileName, {create: false})
    const file = await fd.getFile();
    const fileStream = file.stream();
    return new Response(fileStream, {
        headers:{
            'Content-Disposition': `attachment; filename=${fileName}`,
            'Content-Type': `application/octet-stream`,
            'Content-Length': file.size,
        }
    })
}