export default {
  name: "disable",
  aliases: ["dis"],
  description: "Disable a group feature",
  category: "group",
  usage: "disable",
  cooldown: 5,
  isAdmin: true,
  isBotAdmin: true,
  isGroup: true,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      let args = M.args.trim().toLowerCase();
      let gc = await Neko.gc_db.getGroup(M.from, M.groupMeta?.subject);
      switch (args) {
        case "antilink":
        case "antilinkgc":
        case "antilinkgroup":
          if (!gc.isAntilink) {
            return await Neko.sendTextMessage(
              M.from,
              "Anti-Link is already disabled",
              M,
            );
          }
          await Neko.gc_db.setGcAntilink(M.from, false);
          await Neko.sendTextMessage(M.from, "*Antilink has been disabled*", M);
          break;
        case "welcome":
        case "welcomegc":
        case "welcomegroup":
          await Neko.gc_db.setGcWelcome(M.from, false);
          await Neko.sendTextMessage(M.from, "*Welcome has been disabled*", M);
          break;
        case "reassign":
        case "reassigngc":
        case "reassigngroup":
          if (!gc.isReassign) {
            return await Neko.sendTextMessage(
              M.from,
              "*Reassign is already disabled*",
              M,
            );
          }
          await Neko.gc_db.setGcReassign(M.from, false);
          await Neko.sendTextMessage(M.from, "*Reassign has been disabled*", M);
          break;
        case "nsfw":
        case "nsfwgc":
        case "nsfwgroup":
          if (!gc.isNsfw) {
            return await Neko.sendTextMessage(
              M.from,
              "*NSFW is already disabled*",
              M,
            );
          }
          await Neko.gc_db.setGcNsfw(M.from, false);
          await Neko.sendTextMessage(M.from, "*NSFW has been disabled*", M);
          break;
        case "antinsfw":
        case "antinsfwgc":
          if (!gc.isAntiNsfw) {
            return await Neko.sendTextMessage(
              M.from,
              "*Anti-NSFW is already disabled*",
              M,
            );
          }
          await Neko.gc_db.setGcAntiNsfw(M.from, false);
          await Neko.sendTextMessage(
            M.from,
            "*Anti-NSFW has been disabled*",
            M,
          );
          break;
        default:
          await Neko.sendTextMessage(
            M.from,
            "*Invalid argument. Please use one of the following: antilink, welcome, reassign, nsfw*",
            M,
          );
          break;
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
