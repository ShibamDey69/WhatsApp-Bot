export default {
  name: "demote",
  aliases: ["dt"],
  description: "Demote a user to member",
  category: "group",
  usage: "demote @tag",
  cooldown: 5,
  isAdmin: true,
  isBotAdmin: true,
  isGroup: true,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      if (!M?.isQuoted && !M?.isMentioned) {
        await Neko.sendTextMessage(
          M.from,
          "Please reply or mention to the user you want to demote",
          M,
        );
        return;
      }
      const user = M.isMentioned ? M.mention[0] : M.quoted.sender;
      if (M?.groupOwner === user) {
        await Neko.sendTextMessage(
          M.from,
          "This user is the group owner. You can't demote him",
          M,
        );
        return;
      }
      if (!M?.admins?.includes(user)) {
        await Neko.sendTextMessage(M.from, "This user is not an admin", M);
        return;
      }
      await Neko.groupParticipantsUpdate(M?.from, [user], "demote");
      await Neko.sendMentionMessage(
        M.from,
        `User @${user.split("@")[0]} has been demoted to member`,
        [user],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
