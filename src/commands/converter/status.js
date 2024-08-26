export default {
  name: "status",
  aliases: ["status"],
  description: "Get the status of the ",
  usage: "status",
  category: "converter",
  cooldown: 5,
  isMod: false,
  isPro: false,
  isGroup: false,
  isBotAdmin: false,
  isAdmin: false,
  isOwner: false,
  run: async (Neko, M) => {
    try {
      if (M.isGroup) {
        return await Neko.sendTextMessage(
          M.from,
          "This command is only available in private chats",
          M,
        );
      }

      if (!M.isStatus) {
        return await Neko.sendTextMessage(
          M.from,
          "This command is only available in private chats... for collecting status use this command in reply of the status you want",
          M,
        );
      }

      if (M.isStatus) {
        const media = await Neko.downloadMediaContent(Neko, M.quoted);
        switch (M?.quoted?.mtype.toLowerCase()) {
          case "audio":
            await Neko.sendAudioMessage(M.from, media.data, M);
            break;
          case "video":
            await Neko.sendVideoMessage(M.from, media.data, M);
            break;
          case "image":
            await Neko.sendImageMessage(M.from, media.data, M);
            break;
          case "extendedtext":
            await Neko.sendTextMessage(M.from, media.data, M);
            break;
          default:
            await Neko.sendTextMessage(M.from, "Unsupported media type", M);
            break;
        }
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
