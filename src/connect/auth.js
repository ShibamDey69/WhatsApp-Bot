import sessionSchema from "./authSchema.js";
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
            const fileContent = await sessionSchema.findOne({sessionId: fileName})
            if (fileContent.session.length > 0) {
                const content = JSON.parse(fileContent.session, BufferJSON.reviver)
                this.fileCache.set(fileName, content)
                return content
            }
        } catch (error) {
            // Do nothing if the file does not exist
        }

        return null
    }

    async saveFile(fileName, content) {
        const serializedContent = JSON.stringify(content, BufferJSON.replacer, 2);

        // Check if session with fileName exists
        let session = await sessionSchema.findOne({ sessionId: fileName });

        if (session) {
            // If session exists, update it
            session.session = serializedContent;
            await session.save();
        } else {
            // If session doesn't exist, create a new one
            session = await new sessionSchema({
                sessionId: fileName,
                session: serializedContent
            }).save();
        }

        return session;
    }

    async deleteFile(fileName) {
        try {
        await sessionSchema.deleteOne({sessionId:fileName})
        } catch (error) {
            // Do nothing if the file does not exist
        }
    }
}

export default class AuthenticationFromMongo {
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

    async useMongoAuth() {
  if(!this.sessionId) return `Provide a valid session folder`
        const fileName = `${this.sessionId}`

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
