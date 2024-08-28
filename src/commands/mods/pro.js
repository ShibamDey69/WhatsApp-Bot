export default {
  name: "pro",
  aliases: ["pro"],
  description: "Set or unset a user's mod status",
  category: "mods",
  usage: "pro @tag/mention --true/false",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: true,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      // Determine the user to be modified and the new pro status
      let user = M.isMentioned ? M.mention[0] : M.quoted.sender;
      if (!user) {
        return Neko.sendTextMessage(
          M.from,
          "Please mention or quote a user to modify their pro status.",
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

      let isPro = status === "true";
      let userId = user.split("@")[0];
      let usr = await Neko.user_db.getUser(userId);
      if (usr.isPro === isPro) {
        return Neko.sendMentionMessage(
          M.from,
          `User *@${userId}* is already ${isPro ? "a pro user" : "not a pro user"}.`,
          [user],
          M,
        );
      }

      // Update the user's pro status
      await Neko.user_db.setPro(userId, isPro);
      let action = isPro ? "promoted to" : "demoted from";
      return Neko.sendMentionMessage(
        M.from,
        `User *@${userId}* has been ${action} pro status.`,
        [user],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
