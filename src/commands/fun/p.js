import P from "../../utils/p.js";
const p = new P();
export default {
  name: "porn",
  aliases: ["xnxx"],
  desc: "Play porn from xnxx",
  category: "converter",
  usage: `porm <video name>`,
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      if (!M.args) {
        return await Neko.sendTextMessage(
          M.from,
          "Please provide a query",
          M,
        );
      }
    
      const data = await p.fetchRandomJson(M.args);
      if (!data.contentUrl) {
        return await Neko.sendTextMessage(
          M.from,
          "Failed to search the video",
          M,
        );
      }
      
        let res = data.contentUrl;
        return await Neko.sendVideoMessage(M.from, res, M);
      
    } catch (error) {
      Neko.error(error);
    }
  },
};
