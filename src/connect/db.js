import { v4 as uuidv4 } from "uuid";
import { QuickDB } from "quick.db";
import path, { join } from "path";
const __dirname = path.resolve();

class UserDbFunc {
  constructor() {
    this.path = (name) => join(__dirname, "src/tmp", `${name}.sqlite`);
    this.User = new QuickDB({ filePath: this.path("user") });
  }

  async getUser(Sender, name) {
    try {
      if (!Sender.endsWith("@g.us")) {
      let sender = Sender.replace("@s.whatsapp.net", "");
      let newUser =
        (await this.User.get(sender)) ||
        (await this.User.set(sender, {
          _uid: uuidv4(),
          user_id: Sender,
          username: name || "No Name Found",
          isPro:false,
          isBanned: false,
          isMod: false
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
      let users = await this.User.all();
      let filter = users.filter((user) => user.value[key] === value);
      return filter;
    } catch (error) {
      throw new Error(error);
    }
  }

  
  async setPremium(Sender, state = true) {
    try {
      if(!Sender.endsWith("@g.us")) {
      let sender = Sender.replace("@s.whatsapp.net","");
      let premium = await this.getUser(sender);
      if (!premium) {
        throw new Error("User not found");
      }
      premium.isPro = state;
      await this.User.set(sender, premium);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setBanned(Sender, state = true) {
    try {
      if(!Sender.endsWith("@g.us")) {
      let sender = Sender.replace("@s.whatsapp.net","");
      let banned = await this.User.get(sender);
      if (!banned) {
        throw new Error("User not found");
      }
      banned.isBanned = state;
      await this.User.set(sender, banned);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setMod(Sender, state = true) {
    try {
      if (!Sender.endsWith("@g.us")) {
      let sender = Sender.replace("@g.us", "");
      let mod = await this.User.get(sender);
      if (!mod) {
        throw new Error("User not found");
      }
      mod.isMod = state;
      await this.User.set(sender, mod);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}


class GroupDbFunc {
  constructor() {
    this.path = (name) => join(__dirname, "src/tmp", `${name}.sqlite`);
    this.Group = new QuickDB({ filePath: this.path("group") });
    
  }
  async getGroup(groupId, groupName) {
    try {
      if(groupId.endsWith("@g.us")) {
        let GroupId = groupId.replace("@g.us","");
        let newGroup = (await this.Group.get(GroupId)) || (await this.Group.set(GroupId,{
        _uid: uuidv4(),
        group_id: groupId,
        name: groupName || "No Name Found",
        isBanned: false,
        isAntilink:false,
        isWelcome:false,
        isReassign:false,
        isNsfw:false,
        created: Date.now()
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
        let groups = await this.Group.all();
        let filter = groups.filter((group) => group.value[key] === value);
        return filter;
     } catch (error) {
       console.log(error);
        throw new Error(error);
     }
   }

  async setGcBanned(groupId, state = true) {
    try {
      if(groupId.endsWith("@g.us")) {
      let GroupId = groupId.replace("@g.us","");
      let banned = await this.Group.get(GroupId);
      if (!banned) {
        throw new Error("Group not found");
      }
      banned.isBanned = state;
      await this.Group.set(GroupId, banned);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async setGcAntilink(groupId, state = true) {
    try {
      if(groupId.endsWith("@g.us")) {
      let GroupId = groupId.replace("@g.us","");
      let antilink = await this.Group.get(GroupId);
      if (!antilink) {
        throw new Error("Group not found");
      }
      antilink.isAntilink = state;
      await this.Group.set(GroupId, antilink);
      }
    } catch (error) {
      throw new Error(error);
    }
  }
  
  async setGcWelcome(groupId, state = true) {
    try {
      if(groupId.endsWith("@g.us")) {
      let GroupId = groupId.replace("@g.us","");
      let welcome = await this.Group.get(GroupId);
      if (!welcome) {
        throw new Error("Group not found");
      }
      welcome.isWelcome = state;
      await this.Group.set(GroupId, welcome);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async setGcReassign(groupId, state = true) {
    try {
      if(groupId.endsWith("@g.us")) {
      let GroupId = groupId.replace("@g.us","");
      let reassign = await this.Group.get(GroupId);
      if (!reassign) {
        throw new Error("Group not found");
      }
      reassign.isReassign = state;
      await this.Group.set(GroupId, reassign);
      }
    } catch (error) {
    console.log(error);
    throw new Error(error);
    }
  }

  async setGcNsfw(groupId, state = true) {
    try {
      if(groupId.endsWith("@g.us")) {
      let GroupId = groupId.replace("@g.us","");
      let nsfw = await this.Group.get(GroupId);
      if (!nsfw) {
        throw new Error("Group not found");
      }
      nsfw.isNsfw = state;
      await this.Group.set(GroupId, nsfw);
      }
    } catch (error) {
      throw new Error(error);
    }
  }
} 


export default { UserDbFunc, GroupDbFunc};