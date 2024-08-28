export default {
  name: "mods",
  aliases: ["mods"],
  desc: "List of mods",
  category: "Utility",
  usage: `mods`,
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      let mods = M.mods;
      let modsText = "_*-:All Mods:-*_\n";
      for (let i = 0; i < mods.length; i++) {
        modsText += `*${i + 1}.* @${mods[i].split("@")[0]}\n`;
      }
      return await Neko.sendMentionMessage(M.from, modsText, M.mods, M);
    } catch (error) {
      await Neko.error(error);
    }
  },
};
