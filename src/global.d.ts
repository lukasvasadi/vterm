type PortInfo = import("@serialport/bindings-cpp").PortInfo

declare namespace api {
    import IpcRendererEvent = Electron.IpcRendererEvent

    function getPorts(): Promise<PortInfo[]>

    function setPort(port: string, baudrate: number): boolean

    function invokeWrite(data: string): boolean

    function handleRead(callback: (_: IpcRendererEvent, data: string) => void): string

    function closePort(): void
}
