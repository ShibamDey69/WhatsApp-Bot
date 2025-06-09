import path, { join } from "path";
import fs from "fs-extra";
import { LRUCache } from "lru-cache";

const __dirname = path.resolve();
const userFilePath = join(__dirname, "src/tmp", "user.json");

// Setup cache
const userCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 10, // 10 minutes
});

class userDBFunc {
  constructor() {
    if (!fs.existsSync(userFilePath)) {
      fs.writeFileSync(userFilePath, JSON.stringify({}));
    }
  }

  #getId(Sender) {
    return Sender.replace("@s.whatsapp.net", "");
  }

  async #loadUsers() {
    return JSON.parse(await fs.readFile(userFilePath));
  }

  async #saveUsers(users) {
    await fs.writeFile(userFilePath, JSON.stringify(users, null, 2));
  }

  async #updateUserProp(Sender, updates) {
    if (Sender.endsWith("@g.us")) return;
    const id = this.#getId(Sender);
    const users = await this.#loadUsers();
    if (!users[id]) throw new Error("User not found");
    Object.assign(users[id], updates);
    await this.#saveUsers(users);
    userCache.set(id, users[id]); // Update cache
  }

  async getUser(Sender, name) {
    if (Sender.endsWith("@g.us")) return;
    const id = this.#getId(Sender);

    // 🔁 Check cache first
    if (userCache.has(id)) return userCache.get(id);

    const users = await this.#loadUsers();

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
      };
      await this.setUser(id, newUser);
      userCache.set(id, newUser); // Add to cache
      return newUser;
    }

    userCache.set(id, users[id]); // Cache existing
    return users[id];
  }

  async filterUser(key, value) {
    const users = await this.#loadUsers();
    return Object.values(users).filter((user) => user[key] === value);
  }

  async setUser(userId, data) {
    const users = await this.#loadUsers();
    users[userId] = data;
    await this.#saveUsers(users);
    userCache.set(userId, data); // Update cache
    return data;
  }

  async setPro(Sender, state = true) {
    await this.#updateUserProp(Sender, { isPro: state });
  }
  async setBanned(Sender, state = true) {
    await this.#updateUserProp(Sender, { isBanned: state });
  }
  async setMod(Sender, state = true) {
    await this.#updateUserProp(Sender, { isMod: state });
  }
  async setStatusView(Sender, state = true) {
    await this.#updateUserProp(Sender, { isStatusView: state });
  }

  async setMarried(Sender, partner, state = true) {
    await this.#updateUserProp(Sender, {
      isMarried: state,
      partner,
      proposal: [],
    });
  }

  async addProposal(Sender, partner) {
    if (Sender.endsWith("@g.us")) return;
    const id = this.#getId(Sender);
    const users = await this.#loadUsers();
    if (!users[id]) throw new Error("User not found");
    users[id].proposal.push(partner);
    await this.#saveUsers(users);
    userCache.set(id, users[id]); // Update cache
  }

  async rejectProposal(Sender, partner) {
    if (Sender.endsWith("@g.us")) return;
    const id = this.#getId(Sender);
    const users = await this.#loadUsers();
    if (!users[id]) throw new Error("User not found");
    users[id].proposal = users[id].proposal.filter((p) => p !== partner);
    await this.#saveUsers(users);
    userCache.set(id, users[id]); // Update cache
  }
}

export default userDBFunc;
