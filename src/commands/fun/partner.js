export default {
  name: "partner",
  aliases: ["wife", "husband"],
  description: "showing the partner if available",
  category: "fun",
  usage: "partner",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      const user = await Neko.user_db.getUser(M.sender);
      if (!user.partner) {
        return await Neko.sendMentionMessage(
          M.from,
          "You are not married to anyone",
          [M.sender],
          M,
        );
      }

      return await Neko.sendMentionMessage(
        M.from,
        `You are married to @${user.partner.split("@")[0]}`,
        [M.sender, user.partner],
        M,
      );
    } catch (error) {
      await Neko.error(error);
    }
  },
};
