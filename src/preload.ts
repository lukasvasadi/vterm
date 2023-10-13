import {ipcRenderer, contextBridge} from "electron"
import IpcRendererEvent = Electron.IpcRendererEvent

contextBridge.exposeInMainWorld("api", {
    getPorts: () => ipcRenderer.invoke("get-ports"),
    setPort: (port: string, baudrate: number) =>
        ipcRenderer.invoke("set-port", port, baudrate),
    invokeWrite: (data: string) => ipcRenderer.invoke("send-data", data),
    handleRead: (callback: (_: IpcRendererEvent, data: string) => void) => ipcRenderer.on("get-data", callback),
    closePort: () => ipcRenderer.send("close-port"),
})
