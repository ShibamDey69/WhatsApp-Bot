export default {
  name: "ship",
  aliases: ["ship"],
  desc: "Ship two users",
  category: "fun",
  usage: `ship @tag | ship @tag1 @tag2`,
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: true,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      const user = M.isMentioned ? M.mention[0] : M?.quoted?.sender
      if (user.length < 1) {
        return await Neko.sendTextMessage(
          M.from,
          "Please mention two users to ship",
          M,
        );
      }
      const user2 = M?.mention[1] || M.sender;
      const ship = Math.floor(Math.random() * 100) + 1;
      const shipText = `💖 *${ship}%* 💖\n*@${user.split("@")[0]} ❤️ @${user2.split("@")[0]}*`;
      await Neko.sendMentionMessage(M.from, shipText,[user,user2] ,M);
    } catch (error) {
      await Neko.error(error);
    }
  } 
}