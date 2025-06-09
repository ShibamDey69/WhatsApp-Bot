export default {
  name: "ban",
  aliases: ["ban"],
  description: "Ban a user or group from using the bot",
  category: "mods",
  usage: "ban @tag",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: true,
  run: async (Neko, M) => {
    try {
      // Determine the user to be banned
      let user = M.isMentioned ? M.mention[0] : M.quoted.sender;

      if (M.isGroup) {
        let gc = await Neko.groupDB.getGroup(M.from);
        let usr = user ? await Neko.userDB.getUser(user) : null;

        // Check if the group is already banned
        if (gc.isBanned) {
          return Neko.sendTextMessage(
            M.from,
            `This group *${M.groupMeta.subject}* is already banned from using this bot.`,
            M,
          );
        }

        // Check if the mentioned user is already banned and if the sender is a mod
        if (user && usr && usr.isBanned && !usr.isMod) {
          return Neko.sendMentionMessage(
            M.from,
            `This user *@${usr.userid.split("@")[0]}* is already banned from using this bot.`,
            [usr.userid],
            M,
          );
        }

        // Ban the group if no user is mentioned or quoted
        if (!user) {
          await Neko.groupDB.setGcBanned(M.from, true);
          return Neko.sendTextMessage(
            M.from,
            `This group *${M.groupMeta.subject}* has been banned.`,
            M,
          );
        }

        // Ban the mentioned or quoted user if they are not a mod
        if (!usr.isMod) {
          await Neko.userDB.setBanned(usr.userid, true);
          return Neko.sendMentionMessage(
            M.from,
            `This user *@${usr.userid.split("@")[0]}* has been banned.`,
            [usr.userid],
            M,
          );
        } else {
          return Neko.sendMentionMessage(
            M.from,
            `You can't ban *@${usr.userid.split("@")[0]}* because they are a *Mod*.`,
            [usr.userid],
            M,
          );
        }
      } else {
        // Direct message context: Ban the user if they are not a mod
        if (user) {
          let usr = await Neko.userDB.getUser(user.split("@")[0]);

          if (usr.isMod) {
            return Neko.sendMentionMessage(
              M.from,
              `You can't ban *@${user.split("@")[0]}* because they are a *Mod*.`,
              [user],
              M,
            );
          } else {
            await Neko.userDB.setBanned(user.split("@")[0], true);
            return Neko.sendMentionMessage(
              M.from,
              `User *@${user.split("@")[0]}* has been banned.`,
              [user],
              M,
            );
          }
        } else {
          return Neko.sendTextMessage(
            M.from,
            "Please mention or quote a user to ban.",
            M,
          );
        }
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
