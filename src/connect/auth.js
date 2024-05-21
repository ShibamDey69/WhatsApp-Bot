import { promises as fs } from 'node:fs';
import proto,{
    BufferJSON,
    initAuthCreds,
} from '@whiskeysockets/baileys';

class FileStorage {
    constructor() {
        this.fileCache = new Map()
    }

    async loadFile(fileName) {
        if (this.fileCache.has(fileName)) {
            return this.fileCache.get(fileName)
        }

        try {
            const fileContent = await fs.readFile(fileName, 'utf-8')
            if (fileContent.length > 0) {
                const content = JSON.parse(fileContent, BufferJSON.reviver)
                this.fileCache.set(fileName, content)
                return content
            }
        } catch (error) {
            // Do nothing if the file does not exist
        }

        return null
    }

    async saveFile(fileName, content) {
        const serializedContent = JSON.stringify(content, BufferJSON.replacer, 2)
         await fs.writeFile(fileName, serializedContent)
    }

    async deleteFile(fileName) {
        try {
        await fs.unlink(fileName)
        } catch (error) {
            // Do nothing if the file does not exist
        }
    }
}


export default class AuthenticationFromFile {
    constructor(sessionId) {
        this.sessionId = sessionId
        this.fileStorage = new FileStorage()
        this.KEY_MAP = {
            'pre-key': 'preKeys',
            session: 'sessions',
            'sender-key': 'senderKeys',
            'app-state-sync-key': 'appStateSyncKeys',
            'app-state-sync-version': 'appStateVersions',
            'sender-key-memory': 'senderKeyMemory'
        }
    }

    debounce(func, wait) {
        if (!this._debounceTimeouts) {
            this._debounceTimeouts = new Map()
        }

        return (...args) => {
            if (this._debounceTimeouts.has(func)) {
                clearTimeout(this._debounceTimeouts.get(func))
            }

            const timeout = setTimeout(() => {
                func.apply(this, args)
                this._debounceTimeouts.delete(func)
            }, wait)
            this._debounceTimeouts.set(func, timeout)
        }
    }

    async useFileAuth(folder) {
  if(!folder || !this.sessionId) return `Provide a valid session folder`
        const fileName = `./${folder}/${this.sessionId}.json`

        let storedCreds = await this.fileStorage.loadFile(fileName)
        let creds = storedCreds?.creds || initAuthCreds()
        let keys = storedCreds?.keys || {}

        const saveCreds = async () => {
            await this.fileStorage.saveFile(fileName, { creds, keys })
        }

        const debouncedSaveState = this.debounce(saveCreds, 1000)

        const clearState = async () => {
            await this.fileStorage.deleteFile(fileName)
        }

        return {
            state: {
                creds,
                keys: {
                    get: (type, ids) => {
                        const key = this.KEY_MAP[type]
                        return ids.reduce((dict, id) => {
                            const value = keys[key]?.[id]
                            if (value) {
                                if (type === 'app-state-sync-key') {
                                    dict[id] = proto.AppStateSyncKeyData.fromObject(value)
                                } else {
                                    dict[id] = value
                                }
                            }
                            return dict
                        }, {})
                    },
                    set: async (data) => {
                        let shouldSave = false
                        for (const _key in data) {
                            const key = this.KEY_MAP[_key]
                            keys[key] = keys[key] || {}
                            Object.assign(keys[key], data[_key])
                            shouldSave = true
                        }
                        if (shouldSave) {
                            debouncedSaveState()
                        }
                    }
                }
            },
            saveCreds,
            clearState
        }
    }
}