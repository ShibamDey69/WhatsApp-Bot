export default {
  name: "retrieve",
  aliases: ["rv"],
  description: "Retreive a user's profile",
  category: "fun",
  usage: "retreive @tag",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      let mess = Object.keys(M.quoted.message);
      if (
        mess.includes("viewOnceMessageV2") ||
        mess.includes("viewOnceMessageV2Extension")
      ) {
        let res = await Neko.downloadMediaContent(Neko, M.quoted);

        if (res.mime.includes("image")) {
          return await Neko.sendImageMessage(M.from, res.data, M);
        } else if (res.mime.includes("video")) {
          return await Neko.sendVideoMessage(M.from, res.data, M);
        } else if (res.mime.includes("audio")) {
          return await Neko.sendAudioMessage(M.from, res.data, M);
        } else {
          return await Neko.sendTextMessage(
            M.from,
            "Unsupported file type.",
            M,
          );
        }
      } else {
        return await Neko.sendTextMessage(
          M.from,
          "Please tag/quote a viewonce message to retreive the message.",
          M,
        );
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
