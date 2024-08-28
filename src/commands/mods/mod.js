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
      // Determine the user to be modified and the new mod status
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
      let userId = user.split("@")[0];
      let usr = await Neko.user_db.getUser(userId);
      if (usr.isMod === isMod) {
        return Neko.sendMentionMessage(
          M.from,
          `User *@${userId}* is already ${isMod ? "a mod" : "not a mod"}.`,
          [user],
          M,
        );
      }

      // Update the user's mod status
      await Neko.user_db.setMod(userId, isMod);
      let action = isMod ? "promoted to" : "demoted from";
      return Neko.sendMentionMessage(
        M.from,
        `User *@${userId}* has been ${action} mod status.`,
        [user],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
