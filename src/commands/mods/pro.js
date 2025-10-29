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
      let usr = await Neko.userDB.getUser(user);
      if (usr.isPro === isPro) {
        return Neko.sendMentionMessage(
          M.from,
          `User *@${user.split("@")[0]}* is already ${isPro ? "a pro user" : "not a pro user"}.`,
          [user],
          M,
        );
      }

      // Update the user's pro status
      await Neko.userDB.setPro(user, isPro);
      let action = isPro ? "promoted to" : "demoted from";
      return Neko.sendMentionMessage(
        M.from,
        `User *@${user.split("@")[0]}* has been ${action} pro status.`,
        [user],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
