import fsSync, { promises as fs } from "fs";
import path from "path";
import proto, { BufferJSON, initAuthCreds } from "@whiskeysockets/baileys";
import AsyncLock from "async-lock";
const fileLock = new AsyncLock({ maxPending: Infinity });

class FileStorage {
    constructor(folder = "./Auth-info") {
        this.authInfoDir = path.resolve(folder);
        this.fileCache = new Map();
   if(!fsSync.existsSync(this.authInfoDir)) {
           fsSync.mkdirSync(this.authInfoDir);
        }
    }

    async loadFile(fileName) {
        try {
            if (this.fileCache.has(fileName)) {
            return this.fileCache.get(fileName);
            }
            
            const filePath = path.join(this.authInfoDir, fileName);
            const fileContent = await fileLock.acquire(filePath, () =>
                fs.readFile(filePath, { encoding: "utf-8" }),
            );
            const content = JSON.parse(fileContent, BufferJSON.reviver);
            this.fileCache.set(fileName, content);
            return content;
        } catch (error) {
            return null;
        }
    }

    async saveFile(fileName, content) {
        try {
            const serializedContent = JSON.stringify(
            content,
            BufferJSON.replacer,
            2,
        );
        const filePath = path.join(this.authInfoDir, fileName);
            
            return await fileLock.acquire(filePath, () =>
                fs.writeFile(filePath, serializedContent),
            );
        } catch (error) {
            console.error(`Failed to save file ${fileName}:`, error);
        }
    }

    async deleteFile(fileName) {
        try {
            const filePath = path.join(this.authInfoDir, fileName);

            return await fileLock.acquire(filePath, () => fs.unlink(filePath));
        } catch (error) {
            // Do nothing if the file does not exist or any other error occurs
        }
    }
}

export default class Authentication {
    constructor(sessionId, folder) {
        this.sessionId = sessionId;
        this.fileStorage = new FileStorage(folder);
        this.KEY_MAP = {
            "pre-key": "preKeys",
            session: "sessions",
            "sender-key": "senderKeys",
            "app-state-sync-key": "appStateSyncKeys",
            "app-state-sync-version": "appStateVersions",
            "sender-key-memory": "senderKeyMemory",
        };
    }

    debounce(func, wait) {
        if (!this._debounceTimeouts) {
            this._debounceTimeouts = new Map();
        }

        return (...args) => {
            if (this._debounceTimeouts.has(func)) {
                clearTimeout(this._debounceTimeouts.get(func));
            }

            const timeout = setTimeout(() => {
                func.apply(this, args);
                this._debounceTimeouts.delete(func);
            }, wait);
            this._debounceTimeouts.set(func, timeout);
        };
    }

    async singleFileAuth() {
        if (!this.sessionId) throw new Error(`Provide a valid session folder`);
        const fileName = `${this.sessionId}.json`;

        let storedCreds = await this.fileStorage.loadFile(fileName);
        let creds = storedCreds?.creds || initAuthCreds();
        let keys = storedCreds?.keys || {};

        const saveCreds = async () => {
            await this.fileStorage.saveFile(fileName, { creds, keys });
        };

        const debouncedSaveState = this.debounce(saveCreds, 1000);

        const clearState = async () => {
            await this.fileStorage.deleteFile(fileName);
        };

        return {
            state: {
                creds,
                keys: {
                    get: (type, ids) => {
                        const key = this.KEY_MAP[type];
                        return ids.reduce((dict, id) => {
                            const value = keys[key]?.[id];
                            if (value) {
                                if (type === "app-state-sync-key") {
                                    dict[id] =
                                        proto.AppStateSyncKeyData.fromObject(
                                            value,
                                        );
                                } else {
                                    dict[id] = value;
                                }
                            }
                            return dict;
                        }, {});
                    },
                    set: async (data) => {
                        let shouldSave = false;
                        for (const _key in data) {
                            const key = this.KEY_MAP[_key];
                            keys[key] = keys[key] || {};
                            Object.assign(keys[key], data[_key]);
                            shouldSave = true;
                        }
                        if (shouldSave) {
                            debouncedSaveState();
                        }
                    },
                },
            },
            saveCreds,
            clearState,
        };
    }
}
