export default {
  name: "statusview",
  aliases: ["sv"],
  description: "Set or unset a user's status",
  category: "mods",
  usage: "status @tag/mention --true/false",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: true,
  isStatus: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      // Determine the user to be modified and the new status
      let user = M.isMentioned ? M.mention[0] : M.quoted.sender;
      if (!user) {
        return Neko.sendTextMessage(
          M.from,
          "Please mention or quote a user to modify their status.",
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

      let isStatus = status === "true";
      let usr = await Neko.userDB.getUser(user);
      if (usr.isStatus === isStatus) {
        return Neko.sendMentionMessage(
          M.from,
          `User *@${user.split("@")[0]}* is already ${isStatus ? "a status viewer" : "not a status viewer"}.`,
          [user],
          M,
        );
      }

      await Neko.userDB.setStatusView(user, isStatus);
      let action = isStatus ? "granted" : "revoked";
      return Neko.sendMentionMessage(
        M.from,
        `User *@${user.split("@")[0]}* has been ${action} status.`,
        [user],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
