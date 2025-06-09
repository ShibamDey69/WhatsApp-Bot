export default {
  name: "unban",
  aliases: ["unban"],
  description: "Unban a user or group from using the bot",
  category: "mods",
  usage: "unban @tag",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: true,
  run: async (Neko, M) => {
    try {
      // Determine the user to be unbanned
      let user = M.isMentioned ? M.mention[0] : M.quoted.sender;

      if (M.isGroup) {
        let gc = await Neko.groupDB.getGroup(M.from);
        let usr = user ? await Neko.userDB.getUser(user) : null;

        // Check if the group is banned
        if (!gc.isBanned && !usr) {
          return Neko.sendTextMessage(
            M.from,
            `This group *${M.groupMeta.subject}* is not banned.`,
            M,
          );
        }

        // Check if the mentioned user is banned
        if (user && usr && !usr.isBanned) {
          return Neko.sendMentionMessage(
            M.from,
            `This user *@${usr.userId.split("@")[0]}* is not banned.`,
            [usr.userId],
            M,
          );
        }

        // Unban the group if no user is mentioned or quoted
        if (!user) {
          await Neko.groupDB.setGcBanned(M.from, false);
          return Neko.sendTextMessage(
            M.from,
            `This group *${M.groupMeta.subject}* has been unbanned.`,
            M,
          );
        }

        // Unban the mentioned or quoted user
        if (usr.isBanned) {
          await Neko.userDB.setBanned(usr.userId, false);
          return Neko.sendMentionMessage(
            M.from,
            `This user *@${usr.userId.split("@")[0]}* has been unbanned.`,
            [usr.userId],
            M,
          );
        } else {
          return Neko.sendMentionMessage(
            M.from,
            `This user *@${usr.userId.split("@")[0]}* is not banned.`,
            [usr.userId],
            M,
          );
        }
      } else {
        // Direct message context: Unban the user
        if (user) {
          let usr = await Neko.userDB.getUser(user.split("@")[0]);

          if (!usr.isBanned) {
            return Neko.sendMentionMessage(
              M.from,
              `User *@${user.split("@")[0]}* is not banned.`,
              [user],
              M,
            );
          } else {
            await Neko.userDB.setBanned(user.split("@")[0], false);
            return Neko.sendMentionMessage(
              M.from,
              `User *@${user.split("@")[0]}* has been unbanned.`,
              [user],
              M,
            );
          }
        } else {
          return Neko.sendTextMessage(
            M.from,
            "Please mention or quote a user to unban.",
            M,
          );
        }
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
