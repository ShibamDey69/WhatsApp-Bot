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
          isMod: false,
          isMarried: false,
          partner: null,
          proposal:[]
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
      let sender = Sender.replace("@s.whatsapp.net", "");
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

  async setMarried(Sender,partner, state = true,) {
    try {
      if (!Sender.endsWith("@g.us")) {
      let sender = Sender.replace("@s.whatsapp.net", "");
      let married = await this.User.get(sender);
      if (!married) {
        throw new Error("User not found");
      }
      married.isMarried = state;
      married.partner = partner;
      married.proposal = [];
      await this.User.set(sender, married);
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
      let proposal = await this.User.get(sender);
      if (!proposal) {
        throw new Error("User not found");
      }
      proposal.proposal.push(partner);
      await this.User.set(sender, proposal);
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
      let proposal = await this.User.get(sender);
      if (!proposal) {
        throw new Error("User not found");
      }
      proposal.proposal = proposal.proposal.filter((p) => p !== partner);
      await this.User.set(sender, proposal);
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
        mode: "private",
        isBanned: false,
        isAntilink:false,
        isWelcome:false,
        isReassign:false,
        isNsfw:false,
        isAntiNsfw:false,
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

  async setGcMode(groupId, mode = "private") {
    try {
      if(groupId.endsWith("@g.us")) {
      let GroupId = groupId.replace("@g.us","");
      let modeGc = await this.Group.get(GroupId);
      if (!modeGc) {
        throw new Error("Group not found");
      }
      modeGc.mode = mode;
      await this.Group.set(GroupId, modeGc);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async setGcAntiNsfw(groupId, state = true){
    try {
      if(groupId.endsWith("@g.us")) {
      let GroupId = groupId.replace("@g.us","");
      let antiNsfw = await this.Group.get(GroupId);
      if (!antiNsfw) {
        throw new Error("Group not found");
      }
      antiNsfw.isAntiNsfw = state;
      await this.Group.set(GroupId, antiNsfw);
      }
    } catch (error) {
      throw new Error(error);
    }
  }
} 


export default { UserDbFunc, GroupDbFunc};