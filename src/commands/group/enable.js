export default {
  name: "enable",
  aliases: ["en"],
  description: "Enable a group feature",
  category: "group",
  usage: "enable <option>",
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
          if (gc.isAntilink) {
            return await Neko.sendTextMessage(
              M.from,
              "Anti-link is already enabled.",
              M,
            );
          }
          await Neko.gc_db.setGcAntilink(M.from, true);
          await Neko.sendTextMessage(
            M.from,
            "*Anti-link has been enabled.*",
            M,
          );
          break;
        case "welcome":
        case "welcomegc":
        case "welcomegroup":
          await Neko.gc_db.setGcWelcome(M.from, true);
          await Neko.sendTextMessage(M.from, "*Welcome has been enabled.*", M);
          break;
        case "reassign":
        case "reassigngc":
        case "reassigngroup":
          if (gc.isReassign) {
            return await Neko.sendTextMessage(
              M.from,
              "*Reassign is already enabled.*",
              M,
            );
          }
          await Neko.gc_db.setGcReassign(M.from, true);
          await Neko.sendTextMessage(M.from, "*Reassign has been enabled.*", M);
          break;
        case "nsfw":
        case "nsfwgc":
        case "nsfwgroup":
          if (gc.isNsfw) {
            return await Neko.sendTextMessage(
              M.from,
              "*NSFW is already enabled.*",
              M,
            );
          }
          await Neko.gc_db.setGcNsfw(M.from, true);
          await Neko.sendTextMessage(M.from, "*NSFW has been enabled.*", M);
          break;
        case "antinsfw":
        case "antinsfwgc":
          if (gc.isAntiNsfw) {
            return await Neko.sendTextMessage(
              M.from,
              "*Anti-NSFW is already enabled.*",
              M,
            );
          }
          await Neko.gc_db.setGcAntiNsfw(M.from, true);
          await Neko.sendTextMessage(
            M.from,
            "*Anti-NSFW has been enabled.*",
            M,
          );
          break;
        default:
          await Neko.sendTextMessage(
            M.from,
            "*Invalid argument. Please use one of the following: antilink, welcome, reassign, nsfw.*",
            M,
          );
          break;
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
