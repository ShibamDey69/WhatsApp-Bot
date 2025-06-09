import path, { join } from "path";
import fs from "fs-extra";
import { LRUCache } from "lru-cache";

const __dirname = path.resolve();
const groupFilePath = join(__dirname, "src/tmp", "group.json");

// Set up LRU cache
const groupCache = new LRUCache({
  max: 500, // max 500 groups in memory
  ttl: 1000 * 60 * 10, // 10 minutes TTL
});

class groupDBFunc {
  constructor() {
    if (!fs.existsSync(groupFilePath)) {
      fs.writeFileSync(groupFilePath, JSON.stringify({}));
    }
  }

  async #loadGroups() {
    return JSON.parse(await fs.readFile(groupFilePath));
  }

  async #saveGroups(groups) {
    await fs.writeFile(groupFilePath, JSON.stringify(groups, null, 2));
  }

  #getId(id) {
    return id.replace("@g.us", "");
  }

  async #updateGroupProp(groupId, key, value) {
    const id = this.#getId(groupId);
    const groups = await this.#loadGroups();
    if (!groups[id]) throw new Error("Group not found");
    groups[id][key] = value;
    await this.#saveGroups(groups);

    // ✅ Update cache too
    const cached = groupCache.get(id);
    if (cached) {
      cached[key] = value;
      groupCache.set(id, cached);
    }
  }

  async getGroup(groupId, groupName) {
    if (!groupId.endsWith("@g.us")) return;
    const id = this.#getId(groupId);

    // ✅ Use cache if available
    if (groupCache.has(id)) return groupCache.get(id);

    const groups = await this.#loadGroups();
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
      };
      await this.setGroup(id, newGroup);
      groupCache.set(id, newGroup);
      return newGroup;
    }

    // ✅ Store in cache and return
    groupCache.set(id, groups[id]);
    return groups[id];
  }

  async filterGroup(key, value) {
    const groups = await this.#loadGroups();
    return Object.values(groups).filter((g) => g[key] === value);
  }

  async setGroup(groupId, data) {
    const groups = await this.#loadGroups();
    groups[groupId] = data;
    await this.#saveGroups(groups);
    groupCache.set(groupId, data); // ✅ Update cache
    return data;
  }

  async setGcBanned(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isBanned", state);
  }
  async setGcAntilink(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isAntilink", state);
  }
  async setGcWelcome(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isWelcome", state);
  }
  async setGcReassign(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isReassign", state);
  }
  async setGcNsfw(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isNsfw", state);
  }
  async setGcAntiNsfw(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isAntiNsfw", state);
  }
  async setGcChatAi(groupId, state = true) {
    await this.#updateGroupProp(groupId, "isChatAi", state);
  }
  async setGcMode(groupId, mode = "private") {
    await this.#updateGroupProp(groupId, "mode", mode);
  }
}

export default groupDBFunc;
