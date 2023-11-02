import './index.css'
import '@fortawesome/fontawesome-free/js/all'
import IpcRendererEvent = Electron.IpcRendererEvent

// states are immutable
const states = Object.freeze({
    Closed: 'CLOSED',
    Incoming: 'IN',
    Outgoing: 'OUT'
})

const tags = Object.freeze({
    Error: 'Error',
    Warning: 'Warning',
    Status: 'Status'
})

let state = states.Closed

let delimiter = '\n'
let inc = 0
let messages: string[] = []

const portSelector = document.querySelector('select')
const baudrateInput = document.querySelector(
    'input[name="baudrate"]'
) as HTMLInputElement
const delimiterSelector = document.querySelector(
    'input[name="delimiter"]'
) as HTMLInputElement
const textarea = document.querySelector('textarea')
const messageInput = document.querySelector(
    'input[id=message]'
) as HTMLInputElement
const startBtn = document.querySelector('button[id=start]') as HTMLButtonElement
const refreshBtn = document.querySelector(
    'button[id=refresh]'
) as HTMLButtonElement

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
    textarea.value += data
    textarea.scrollTop = textarea.scrollHeight
}

api.handleRead((_: IpcRendererEvent, data: string) => {
    switch (state) {
        case states.Outgoing:
            updateTextarea('>> ' + data)
            state = states.Incoming
            break
        case states.Incoming:
            updateTextarea(data)
            break
        default:
            break
    }
})

api.handleError((_: IpcRendererEvent, err: string) => {
    new Notification('Port handling error', {
        tag: tags.Error,
        body: err,
        requireInteraction: true
    })

    if (err.includes('cannot open')) state = states.Closed
})

startBtn.onclick = () => {
    if (state === states.Closed) {
        const path = portSelector.value.split(' ', 1)[0]
        const baudrate = parseInt(baudrateInput.value)
        delimiter = delimiterSelector.value
            .replace(/\\r/g, '\r')
            .replace(/\\n/g, '\n')

        if (path && baudrate) {
            if (api.setPort(path, baudrate, delimiter)) {
                state = states.Outgoing
                const portStatusNotification = new Notification(
                    'Device connected!',
                    {
                        tag: tags.Status
                    }
                )
                setTimeout(() => portStatusNotification.close(), 2000)
            } else {
                const portStatusNotification = new Notification(
                    'Unable to connect device',
                    {
                        tag: tags.Error,
                        body: 'Check that the comport is not open in another application'
                    }
                )
                setTimeout(() => portStatusNotification.close(), 4000)
            }
        } else {
            const missingDataNotification = new Notification(
                'Missing device or baudrate data',
                {
                    tag: tags.Warning
                }
            )
            setTimeout(() => missingDataNotification.close(), 3000)
        }
    } else {
        const connectionErrorNotification = new Notification(
            'Device already connected',
            {
                tag: tags.Warning,
                body: 'Please refresh to close port'
            }
        )
        setTimeout(() => connectionErrorNotification.close(), 4000)
    }
}

messageInput.onkeydown = (e: KeyboardEvent) => {
    if (e.key == 'Enter') {
        e.preventDefault()
        if (state !== states.Closed) {
            const data = messageInput.value
            if (data) {
                api.invokeWrite(data + delimiter)
                switch (state) {
                    case states.Outgoing:
                        updateTextarea('<< ' + data + '\n')
                        break
                    case states.Incoming:
                        updateTextarea('\n<< ' + data + '\n')
                        state = states.Outgoing
                        break
                    default:
                        break
                }

                if (data != messages[messages.length - 1]) messages.push(data)
                inc = 0
                messageInput.value = ''
            }
        }
    } else if (e.key == 'ArrowUp' && messages.length) {
        e.preventDefault()
        if (inc < messages.length) inc++
        messageInput.value = messages[messages.length - inc]
    } else if (e.key == 'ArrowDown' && messages.length) {
        e.preventDefault()
        if (inc > 0) inc--
        if (!inc) messageInput.value = ''
        else messageInput.value = messages[messages.length - inc]
    }
}

refreshBtn.onclick = () => {
    textarea.value = ''
    messages = []

    if (state !== states.Closed) {
        api.closePort()

        const portStatusNotification = new Notification('Port closed', {
            tag: tags.Status
        })
        setTimeout(() => portStatusNotification.close(), 2000)
    }

    state = states.Closed

    // refresh port selection
    for (let i = portSelector.options.length - 1; i > 0; i--)
        portSelector.remove(i)
    void getPorts()

    const portRefreshNotification = new Notification('Port list updated', {
        tag: tags.Status
    })
    setTimeout(() => portRefreshNotification.close(), 4000)
}

void getPorts() // Search for ports on startup
