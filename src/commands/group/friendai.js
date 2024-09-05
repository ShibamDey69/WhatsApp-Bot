export default {
  name: "friendai",
  category: "fun",
  aliases: ["fai"],
  description: "Chat with the AI friend",
  usage: "friendai --true/false",
  isAdmin: false,
  isBotAdmin: false,
  isGroup: true,
  isOwner: false,
  isPro: false,
  isMod: false,
  cooldown: 10,
  run: async (Neko, M) => {
    try {
      let { args } = M;
      let status = args.toLowerCase()?.split("--")[1]?.trim();
      if (status !== "true" && status !== "false") {
        return Neko.sendTextMessage(
          M.from,
          "Please specify the status as --true or --false.",
          M,
        );
      }
      let isFriendAI = status === "true";
      let gc = await Neko.gc_db.getGroup(M.from);
      if (gc.isChatAi && isFriendAI) {
        return Neko.sendTextMessage(
          M.from,
          "This group already has FriendAI enabled.",
          M,
        );
      }
      if (!gc.isChatAi && !isFriendAI) {
        return Neko.sendTextMessage(
          M.from,
          "This group already has FriendAI disabled.",
          M,
        );
      }
      if (isFriendAI) {
        await Neko.gc_db.setGcChatAi(M.from, true)
        return await Neko.sendTextMessage(
          M.from,
          "AI friend has been enabled.",
          M
        );
      } else {
        await Neko.gc_db.setGcChatAi(M.from, false)
        return await Neko.sendTextMessage(
          M.from,
          "AI friend has been disabled.",
          M
        );
      }
    } catch (error) {
      await Neko.error(error);
    }
  }
}