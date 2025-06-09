import path, { join } from "path"
import fs from "fs-extra"
import { LRUCache } from "lru-cache"

const __dirname = path.resolve()
const groupFilePath = join(__dirname, "src/tmp", "group.json")

const groupCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 10, // 10 minutes
})

class GroupDBFunc {
  constructor() {
    fs.ensureFileSync(groupFilePath)
    this.#initializeFile()
  }

  async #initializeFile() {
    try {
      const stats = await fs.stat(groupFilePath)
      if (stats.size === 0) await fs.writeFile(groupFilePath, JSON.stringify({}))
    } catch {
      await fs.writeFile(groupFilePath, JSON.stringify({}))
    }
  }

  #getId(groupId) {
    return groupId.replace("@g.us", "")
  }

  async #loadGroups() {
    try {
      const content = await fs.readFile(groupFilePath, "utf-8")
      return JSON.parse(content)
    } catch (err) {
      console.error("Error reading group.json:", err)
      return {}
    }
  }

  async #saveGroups(groups) {
    try {
      await fs.writeFile(groupFilePath, JSON.stringify(groups, null, 2))
    } catch (err) {
      console.error("Error writing group.json:", err)
    }
  }

  async #updateGroupProp(groupId, key, value) {
    const id = this.#getId(groupId)
    const groups = await this.#loadGroups()

    if (!groups[id]) throw new Error("Group not found")

    groups[id][key] = value
    await this.#saveGroups(groups)

    const cached = groupCache.get(id)
    if (cached) {
      cached[key] = value
      groupCache.set(id, cached)
    }
  }

  async getGroup(groupId, groupName) {
    if (!groupId.endsWith("@g.us")) return
    const id = this.#getId(groupId)

    if (groupCache.has(id)) return groupCache.get(id)

    const groups = await this.#loadGroups()

    if (!groups[id]) {
      const newGroup = {
        groupId,
        name: groupName || "No Name Found",
        mode: "private",
        isBanned: false,
        isAntilink: false,
        isWelcome: false,
        isReassign: false,
        isNsfw: false,
        isAntiNsfw: false,
        isChatAi: false,
        createdAt: Date.now(),
      }
      groups[id] = newGroup
      await this.#saveGroups(groups)
      groupCache.set(id, newGroup)
      return newGroup
    }

    groupCache.set(id, groups[id])
    return groups[id]
  }

  async filterGroup(key, value) {
    const groups = await this.#loadGroups()
    return Object.values(groups).filter((g) => g[key] === value)
  }

  async setGroup(groupId, data) {
    const id = this.#getId(groupId)
    const groups = await this.#loadGroups()
    groups[id] = data
    await this.#saveGroups(groups)
    groupCache.set(id, data)
    return data
  }

  async setGcBanned(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isBanned", state)
  }

  async setGcAntilink(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isAntilink", state)
  }

  async setGcWelcome(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isWelcome", state)
  }

  async setGcReassign(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isReassign", state)
  }

  async setGcNsfw(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isNsfw", state)
  }

  async setGcAntiNsfw(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isAntiNsfw", state)
  }

  async setGcChatAi(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isChatAi", state)
  }

  async setGcMode(groupId, mode = "private") {
    await this.#updateGroupProp(groupId, "mode", mode)
  }
}

export default GroupDBFunc
