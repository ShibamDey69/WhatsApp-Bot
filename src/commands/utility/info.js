export default {
  name: "info",
  aliases: ["info", "i"],
  desc: "Get information about a command",
  category: "Utility",
  usage: `info <command name>`,
  cooldown: 1,
  isAdmin: false,
  isGroup: false,
  isBotAdmin: false,
  isMod: false,
  isPro: false,
  isOwner: false,
  run: async (Neko, M) => {
    try {
      if (M.args.length < 1) {
        return await Neko.sendTextMessage(
          M.from,
          `Please provide a command name`,
          M,
        );
      }
      let cmdName = M.args;
      if (!Neko.commands.has(cmdName)) {
        return await Neko.sendTextMessage(
          M.from,
          `*${cmdName}* - doesn't exist in this bot!`,
          M,
        );
      }
      let cmdData = Neko.commands.get(cmdName);
      let cmdDesc = cmdData?.desc || "No Description";
      let cmdUsage = cmdData?.usage || "No Usage";
      let cmdName1 = cmdData?.name || "No Name";
      let cmdCategory = cmdData?.category || "No Category";
      let cmdAlias = cmdData?.aliases || "No Alias";
      return await Neko.sendTextMessage(
        M.from,
        `*${cmdName}* - ${cmdDesc}\n*Name:* ${cmdName1}\n*Usage:* ${cmdUsage}\n*Category:* ${cmdCategory}\n*Alias:* ${cmdAlias}`,
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
