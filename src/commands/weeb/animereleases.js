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
      const day = new Date();
      const startDay = day.setHours(0, 0, 0, 0);
      const endDay = day.setHours(23, 59, 59, 999);
      const startDayMs = Math.floor(startDay / 1000);
      const endDayMs = Math.floor(endDay / 1000);

      const data = await animeair(startDayMs, endDayMs);
      if (!data) {
        return await Neko.sendTextMessage(M.from, "No anime releases found", M);
      }
      const sortedData = data.sort(
        (resA, resB) => resA.airingAt - resB.airingAt);

      for (const anime of sortedData) {
        const { id, episode, media, airingAt } = anime;
        const { title, description } = media;
        const message = `*Id:* ${id}\n*Title:* ${title.romaji}\n*Episode:* ${episode}\n*Airing At:* ${new Date(airingAt * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000).toLocaleString()}\n*Description:* ${description}`;

        try {
          await Neko.sendTextMessage(M.from, message, M);
        } catch (error) {
          console.error(`Failed to send message for Anime ID ${id}:`, error);
        }
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
