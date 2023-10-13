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

import './index.css'
import '@fortawesome/fontawesome-free/js/all'
import IpcRendererEvent = Electron.IpcRendererEvent

let isPortOpen = false
let delimiter = '\n'
let inc = 0
let messages: string[] = []

async function getPorts() {
    const ports = await api.getPorts()
    const select = document.querySelector('select')

    ports.forEach((port) => {
        // ignore macOS bluetooth port
        if (!port.path.includes('Bluetooth-Incoming-Port')) {
            const option = document.createElement('option')
            if (port.manufacturer)
                option.text = port.path + ' | ' + port.manufacturer
            else option.text = port.path
            select.add(option)
        }
    })
}

function updateTextarea(data: string) {
    const textarea = document.querySelector('textarea')
    textarea.value += data
    textarea.scrollTop = textarea.scrollHeight
}

api.handleRead((_: IpcRendererEvent, data: string) =>
    updateTextarea('>> ' + data)
)

document.getElementById('start').onclick = () => {
    const path = document.querySelector('select').value.split(' ', 1)[0]
    const baudrate = parseInt(
        (document.querySelector('input[name="baudrate"]') as HTMLInputElement)
            .value
    )
    delimiter = (
        document.querySelector('input[name="delimiter"]') as HTMLInputElement
    ).value
        .replace(/\\r/g, '\r')
        .replace(/\\n/g, '\n')

    if (path && baudrate) {
        isPortOpen = api.setPort(path, baudrate, delimiter)

        if (isPortOpen) {
            const portStatusNotification = new Notification('Device connected!')
            setTimeout(() => portStatusNotification.close(), 3000)
        } else {
            const portStatusNotification = new Notification(
                'Unable to connect device...',
                {
                    body: 'Check that comport is not open in another application.'
                }
            )
            setTimeout(() => portStatusNotification.close(), 3000)
        }
    } else {
        const missingDataNotification = new Notification(
            'Missing device or baudrate data'
        )
        setTimeout(() => missingDataNotification.close(), 3000)
    }
}

document.getElementById('message').onkeydown = (e: KeyboardEvent) => {
    if (e.key == 'Enter') {
        e.preventDefault()
        if (isPortOpen) {
            const input = document.getElementById('message') as HTMLInputElement
            const data = input.value

            if (data) {
                api.invokeWrite(data + delimiter)
                updateTextarea('<< ' + data + '\n')
                if (data != messages[messages.length - 1]) messages.push(data)
                inc = 0
                input.value = ''
            }
        }
    } else if (e.key == 'ArrowUp' && messages.length) {
        e.preventDefault()
        const input = document.getElementById('message') as HTMLInputElement
        if (inc < messages.length) inc++
        input.value = messages[messages.length - inc]
    } else if (e.key == 'ArrowDown' && messages.length) {
        e.preventDefault()
        const input = document.getElementById('message') as HTMLInputElement
        if (inc > 0) inc--
        if (!inc) input.value = ''
        else input.value = messages[messages.length - inc]
    }
    console.log(inc)
}

document.getElementById('refresh').onclick = () => {
    const textarea = document.getElementById('output') as HTMLTextAreaElement
    textarea.value = ''
    messages = []
    api.closePort()
    isPortOpen = false

    const portStatusNotification = new Notification('Port closed')
    setTimeout(() => portStatusNotification.close(), 3000)
    const select = document.querySelector('select')
    for (let i = select.options.length - 1; i > 0; i--) select.remove(i)
    void getPorts()
}

void getPorts() // Search for ports on startup
