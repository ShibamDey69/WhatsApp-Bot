import { v4 as uuidv4 } from "uuid";
import path, { join } from "path";
import fs from "fs";

const __dirname = path.resolve();
const userFilePath = join(__dirname, "src/tmp", "user.json");
const groupFilePath = join(__dirname, "src/tmp", "group.json");

class UserDbFunc {
  constructor() {
    try {
      if (!fs.existsSync(userFilePath)) {
        fs.writeFileSync(userFilePath, JSON.stringify({}));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async getUser(Sender, name) {
    try {
      if (!Sender.endsWith("@g.us")) {
        let sender = Sender.replace("@s.whatsapp.net", "");
        let users = JSON.parse(fs.readFileSync(userFilePath));
        let newUser =
          users[sender] ||
          (await this.setUser(sender, {
            _uid: uuidv4(),
            user_id: Sender,
            username: name || "No Name Found",
            isPro: false,
            isBanned: false,
            isMod: false,
            isMarried: false,
            partner: null,
            proposal: [],
          }));
        return newUser;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async filterUser(key, value) {
    try {
      let users = JSON.parse(fs.readFileSync(userFilePath));
      let filter = Object.values(users).filter((user) => user[key] === value);
      return filter;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setUser(userId, data) {
    try {
      let users = JSON.parse(fs.readFileSync(userFilePath));
      users[userId] = data;
      fs.writeFileSync(userFilePath, JSON.stringify(users));
      return data;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setPro(Sender, state = true) {
    try {
      if (!Sender.endsWith("@g.us")) {
        let sender = Sender.replace("@s.whatsapp.net", "");
        let user = await this.getUser(sender);
        if (!user) {
          throw new Error("User not found");
        }
        user.isPro = state;
        await this.setUser(sender, user);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setBanned(Sender, state = true) {
    try {
      if (!Sender.endsWith("@g.us")) {
        let sender = Sender.replace("@s.whatsapp.net", "");
        let user = await this.getUser(sender);
        if (!user) {
          throw new Error("User not found");
        }
        user.isBanned = state;
        await this.setUser(sender, user);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setMod(Sender, state = true) {
    try {
      if (!Sender.endsWith("@g.us")) {
        let sender = Sender.replace("@s.whatsapp.net", "");
        let user = await this.getUser(sender);
        if (!user) {
          throw new Error("User not found");
        }
        user.isMod = state;
        await this.setUser(sender, user);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setMarried(Sender, partner, state = true) {
    try {
      if (!Sender.endsWith("@g.us")) {
        let sender = Sender.replace("@s.whatsapp.net", "");
        let user = await this.getUser(sender);
        if (!user) {
          throw new Error("User not found");
        }
        user.isMarried = state;
        user.partner = partner;
        user.proposal = [];
        await this.setUser(sender, user);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async addProposal(Sender, partner) {
    try {
      if (!Sender.endsWith("@g.us")) {
        let sender = Sender.replace("@s.whatsapp.net", "");
        let user = await this.getUser(sender);
        if (!user) {
          throw new Error("User not found");
        }
        user.proposal.push(partner);
        await this.setUser(sender, user);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async rejectProposal(Sender, partner) {
    try {
      if (!Sender.endsWith("@g.us")) {
        let sender = Sender.replace("@s.whatsapp.net", "");
        let user = await this.getUser(sender);
        if (!user) {
          throw new Error("User not found");
        }
        user.proposal = user.proposal.filter((p) => p !== partner);
        await this.setUser(sender, user);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}

class GroupDbFunc {
  constructor() {
    try {
      if (!fs.existsSync(groupFilePath)) {
        fs.writeFileSync(groupFilePath, JSON.stringify({}));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async getGroup(groupId, groupName) {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        let newGroup =
          groups[GroupId] ||
          (await this.setGroup(GroupId, {
            _uid: uuidv4(),
            group_id: groupId,
            name: groupName || "No Name Found",
            mode: "private",
            isBanned: false,
            isAntilink: false,
            isWelcome: false,
            isReassign: false,
            isNsfw: false,
            isAntiNsfw: false,
            isChatAi: false,
            created: Date.now(),
          }));
        return newGroup;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async filterGroup(key, value) {
    try {
      let groups = JSON.parse(fs.readFileSync(groupFilePath));
      let filter = Object.values(groups).filter(
        (group) => group[key] === value,
      );
      return filter;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGroup(groupId, data) {
    try {
      let groups = JSON.parse(fs.readFileSync(groupFilePath));
      groups[groupId] = data;
      fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      return data;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcBanned(groupId, state = true) {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        if (!groups[GroupId]) {
          throw new Error("Group not found");
        }
        groups[GroupId].isBanned = state;
        fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcAntilink(groupId, state = true) {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        if (!groups[GroupId]) {
          throw new Error("Group not found");
        }
        groups[GroupId].isAntilink = state;
        fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcWelcome(groupId, state = true) {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        if (!groups[GroupId]) {
          throw new Error("Group not found");
        }
        groups[GroupId].isWelcome = state;
        fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcReassign(groupId, state = true) {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        if (!groups[GroupId]) {
          throw new Error("Group not found");
        }
        groups[GroupId].isReassign = state;
        fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcNsfw(groupId, state = true) {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        if (!groups[GroupId]) {
          throw new Error("Group not found");
        }
        groups[GroupId].isNsfw = state;
        fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcMode(groupId, mode = "private") {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        if (!groups[GroupId]) {
          throw new Error("Group not found");
        }
        groups[GroupId].mode = mode;
        fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcAntiNsfw(groupId, state = true) {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        if (!groups[GroupId]) {
          throw new Error("Group not found");
        }
        groups[GroupId].isAntiNsfw = state;
        fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcChatAi(groupId, state = true) {
    try {
      if (groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us", "");
        let groups = JSON.parse(fs.readFileSync(groupFilePath));
        if (!groups[GroupId]) {
          throw new Error("Group not found");
        }
        groups[GroupId].isChatAi = state;
        fs.writeFileSync(groupFilePath, JSON.stringify(groups));
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}

export default { UserDbFunc, GroupDbFunc };
