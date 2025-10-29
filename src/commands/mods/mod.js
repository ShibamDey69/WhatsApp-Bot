export default {
  name: "mod",
  aliases: ["mod"],
  description: "Set or unset a user's mod status",
  category: "mods",
  usage: "mod @tag/mention --true/false",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: true,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {

      let user = M.isMentioned ? M.mention[0] : M.quoted.sender;
      if (!user) {
        return Neko.sendTextMessage(
          M.from,
          "Please mention or quote a user to modify their mod status.",
          M,
        );
      }

      let status = M.text.split("--")[1]?.trim();
      if (status !== "true" && status !== "false") {
        return Neko.sendTextMessage(
          M.from,
          "Please specify the status as --true or --false.",
          M,
        );
      }

      let isMod = status === "true";
      let usr = await Neko.userDB.getUser(user);
      if (usr.isMod === isMod) {
        return Neko.sendMentionMessage(
          M.from,
          `User *@${user.split("@")[0]}* is already ${isMod ? "a mod" : "not a mod"}.`,
          [user],
          M,
        );
      }

      await Neko.userDB.setMod(user, isMod);
      await Neko.userDB.setPro(user, isMod);
      let action = isMod ? "promoted to" : "demoted from";
      return Neko.sendMentionMessage(
        M.from,
        `User *@${user.split("@")[0]}* has been ${action} mod status.`,
        [user],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
