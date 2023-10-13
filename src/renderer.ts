/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

// import "./index.css"
// import "@fortawesome/fontawesome-free/js/all"

import "./index.css"
import "@fortawesome/fontawesome-free/js/all"
import IpcRendererEvent = Electron.IpcRendererEvent

let isPortOpen = false

async function getPorts() {
    const ports = await api.getPorts()
    const select = document.querySelector("select")

    for (const key in ports) {
        const option = document.createElement("option")
        if (ports[key].manufacturer) option.text = ports[key].path + " | " + ports[key].manufacturer
        else option.text = ports[key].path
        select.add(option)
    }
}

function updateTextarea(data: string) {
    const textarea = document.querySelector("textarea")
    textarea.value += data
    textarea.scrollTop = textarea.scrollHeight
}

api.handleRead((_: IpcRendererEvent, data: string) => updateTextarea(">> " + data))

document.getElementById("connect").onclick = () => {
    const path = document.querySelector("select").value.split(" ", 1)[0]
    const baudrate = parseInt(
        (document.getElementById("baudrate") as HTMLInputElement).value
    )
    isPortOpen = api.setPort(path, baudrate)

    if (isPortOpen) {
        const portStatusNotification = new Notification("Device connected!")
        setTimeout(() => portStatusNotification.close(), 3000)
    } else {
        const portStatusNotification = new Notification(
            "Unable to connect device...",
            {
                body: "Check that comport is not open in another application.",
            }
        )
        setTimeout(() => portStatusNotification.close(), 3000)
    }
}

document.getElementById("message").onkeydown = (e: KeyboardEvent) => {
    if (e.key == "Enter") {
        e.preventDefault()
        if (isPortOpen) {
            const input = document.getElementById("message") as HTMLInputElement
            const data = input.value

            if (data) {
                api.invokeWrite(data)
                updateTextarea("<< " + data + "\r")
                input.value = ""
            }
        }
    }
}

document.getElementById("refresh").onclick = () => {
    const textarea = document.getElementById("output") as HTMLTextAreaElement
    textarea.value = ""
    api.closePort()

    const portStatusNotification = new Notification("Port closed")
    setTimeout(() => portStatusNotification.close(), 3000)
    const select = document.querySelector("select")
    for (let i = select.options.length - 1; i > 0; i--) select.remove(i)
    void getPorts()
}

void getPorts() // Search for ports on startup
