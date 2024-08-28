import animeair from "../../utils/animerelease.js";
import axios from "axios";
export default {
  name: "animerelease",
  category: "weeb",
  aliases: ["ar"],
  description: "Get the time until the next anime episode release",
  usage: "animerelease",
  isAdmin: false,
  isbotadmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  cooldown: 10,
  run: async (Neko, M) => {
    try {
      const data = await animeair();
      if (!data) {
        return await Neko.sendTextMessage(M.from, "No anime releases found", M);
      }
      data.forEach(async (anime) => {
        const { id, episode, media, airingAt } = anime;
        const { title, description } = media;
        const message = `*Id:* ${id}\n*Title:* ${title.romaji}\n*Episode:* ${episode}\n*Airing in:* ${new Date(airingAt * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000).toLocaleString()}\n*Description:* ${description}\n `;
          
            await Neko.sendTextMessage(M.from, message, M);
      });

      // await Neko.sendImageMessage(M.from, image_url, M,message);
    } catch (error) {
      await Neko.error(error);
    }
  },
};
