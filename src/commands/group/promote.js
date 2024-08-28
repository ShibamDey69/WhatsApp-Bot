export default {
  name: "promote",
  aliases: ["pt"],
  description: "Promote a user to admin",
  category: "group",
  usage: "promote @tag",
  cooldown: 5,
  isAdmin: true,
  isBotAdmin: true,
  isGroup: true,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      if (!M.isQuoted && !M.isMentioned) {
        await Neko.sendTextMessage(
          M.from,
          "Please reply or mention to the user you want to promote",
          M,
        );
        return;
      }
      const user = M.isMentioned ? M.mention[0] : M.quoted.sender;
      if (M.admins.includes(user)) {
        await Neko.sendTextMessage(M.from, "This user is already an admin", M);
        return;
      }
      await Neko.groupParticipantsUpdate(M.from, [user], "promote");
      await Neko.sendMentionMessage(
        M.from,
        `User @${user.split("@")[0]} has been promoted to admin`,
        [user],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
