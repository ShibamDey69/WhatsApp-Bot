export default {
  name: "remove",
  aliases: ["rm"],
  description: "Remove a user from the group",
  category: "group",
  usage: "remove @tag",
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
          "Please reply or mention to the user you want to remove",
          M,
        );
        return;
      }
      const user = M.isMentioned ? M.mention[0] : M.quoted.sender;
      if (M.admins?.includes(user)) {
        await Neko.sendTextMessage(
          M.from,
          "This user is an admin. You can't remove him",
          M,
        );
        return;
      }
      if (M.groupOwner === user) {
        await Neko.sendTextMessage(
          M.from,
          "This user is the group owner. You can't remove him",
          M,
        );
        return;
      }
      await Neko.groupParticipantsUpdate(M?.from, [user], "remove");
      return await Neko.sendMentionMessage(
        M.from,
        `User @${user.split("@")[0]} has been removed from the group`,
        [user],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
