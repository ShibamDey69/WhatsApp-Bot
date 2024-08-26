export default {
  name: "mode",
  aliases: ["mode"],
  description: "Set or unset a user's mod status",
  category: "mods",
  usage: "mode ?=<mode> --true/false",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: true,
  run: async (Neko, M) => {
    try {
      let args = M.args;
      if (!args.includes("--")) {
        return await Neko.sendTextMessage(
          M.from,
          `Please use --public or --admin or --private. like this ${M.prefix}mode --private`,
          M,
        );
      }
      let mode = args?.split("--")[1]?.trim()?.toLowerCase();

      switch (mode) {
        case "private":
          await Neko.gc_db.setGcMode(M.from, mode);
          await Neko.sendTextMessage(
            M.from,
            `Group mode has been set to ${mode}.`,
            M,
          );
          break;
        case "public":
          await Neko.gc_db.setGcMode(M.from, mode);
          await Neko.sendTextMessage(
            M.from,
            `Group mode has been set to ${mode}.`,
            M,
          );
          break;
        case "admin":
          await Neko.gc_db.setGcMode(M.from, mode);
          await Neko.sendTextMessage(
            M.from,
            `Group mode has been set to ${mode}.`,
            M,
          );
          break;
        default:
          await Neko.sendTextMessage(
            M.from,
            `Invalid mode. Please use --public or --admin or --private. like this ${M.prefix}mode --private`,
            M,
          );
          break;
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
