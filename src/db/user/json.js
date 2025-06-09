import path, { join } from "path"
import { promises as fs } from "fs"
import { LRUCache } from "lru-cache"

const __dirname = path.resolve()
const userFilePath = join(__dirname, "src/tmp", "user.json")

const userCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 10, // 10 minutes
})

class UserDBFunc {
  constructor() {
    this.#ensureFile()
  }

  async #ensureFile() {
    try {
      await fs.mkdir(join(__dirname, "src/tmp"), { recursive: true })
      await fs.access(userFilePath)
    } catch {
      await fs.writeFile(userFilePath, JSON.stringify({}))
    }

    const stats = await fs.stat(userFilePath)
    if (stats.size === 0) await fs.writeFile(userFilePath, JSON.stringify({}))
  }

  #getId(Sender) {
    return Sender.replace("@s.whatsapp.net", "")
  }

  async #loadUsers() {
    try {
      const content = await fs.readFile(userFilePath, "utf-8")
      return JSON.parse(content)
    } catch (err) {
      console.error("Error reading user.json:", err)
      return {}
    }
  }

  async #saveUsers(users) {
    try {
      await fs.writeFile(userFilePath, JSON.stringify(users, null, 2))
    } catch (err) {
      console.error("Error writing user.json:", err)
    }
  }

  async #updateUserProp(Sender, updates) {
    if (Sender.endsWith("@g.us")) return
    const id = this.#getId(Sender)
    const users = await this.#loadUsers()
    if (!users[id]) throw new Error("User not found")

    Object.assign(users[id], updates)
    await this.#saveUsers(users)
    userCache.set(id, users[id])
  }

  async getUser(Sender, name) {
    if (Sender.endsWith("@g.us")) return
    const id = this.#getId(Sender)

    if (userCache.has(id)) return userCache.get(id)

    const users = await this.#loadUsers()

    if (!users[id]) {
      const newUser = {
        userId: Sender,
        username: name || "No Name Found",
        isPro: false,
        isBanned: false,
        isMod: false,
        isMarried: false,
        partner: null,
        isStatusView: false,
        proposal: [],
        createdAt: Date.now(),
      }
      users[id] = newUser
      await this.#saveUsers(users)
      userCache.set(id, newUser)
      return newUser
    }

    userCache.set(id, users[id])
    return users[id]
  }

  async filterUser(key, value) {
    const users = await this.#loadUsers()
    return Object.values(users).filter(user => user[key] === value)
  }

  async setUser(userId, data) {
    const users = await this.#loadUsers()
    users[userId] = data
    await this.#saveUsers(users)
    userCache.set(userId, data)
    return data
  }

  async setPro(Sender, state = true) {
    await this.#updateUserProp(Sender, { isPro: state })
  }

  async setBanned(Sender, state = true) {
    await this.#updateUserProp(Sender, { isBanned: state })
  }

  async setMod(Sender, state = true) {
    await this.#updateUserProp(Sender, { isMod: state })
  }

  async setStatusView(Sender, state = true) {
    await this.#updateUserProp(Sender, { isStatusView: state })
  }

  async setMarried(Sender, partner, state = true) {
    await this.#updateUserProp(Sender, {
      isMarried: state,
      partner,
      proposal: [],
    })
  }

  async addProposal(Sender, partner) {
    if (Sender.endsWith("@g.us")) return
    const id = this.#getId(Sender)
    const users = await this.#loadUsers()
    if (!users[id]) throw new Error("User not found")

    if (!users[id].proposal.includes(partner)) {
      users[id].proposal.push(partner)
    }

    await this.#saveUsers(users)
    userCache.set(id, users[id])
  }

  async rejectProposal(Sender, partner) {
    if (Sender.endsWith("@g.us")) return
    const id = this.#getId(Sender)
    const users = await this.#loadUsers()
    if (!users[id]) throw new Error("User not found")

    users[id].proposal = users[id].proposal.filter(p => p !== partner)
    await this.#saveUsers(users)
    userCache.set(id, users[id])
  }
}

export default UserDBFunc
