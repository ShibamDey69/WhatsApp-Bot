import All from "@fongsidev/scraper";
import yts from "yt-search";
import YT from "../../utils/YT.js";
import axios from "axios";
export default {
  name: "play",
  alias: ["p"],
  desc: "Play music from youtube",
  category: "downloader",
  usage: `play <song name>`,
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
          "Please provide a song name.",
          M,
        );
      }
      let args =
        M.args.includes("--video") || M.args.includes("-v")
          ? M.args.replace("--video", "").replace("-v", "")
          : M.args;

      const data = await yts(args);
      if (data?.all?.length === 0) {
        return await Neko.sendTextMessage(
          M.from,
          "Failed to search the song.",
          M,
        );
      }
      const { url } = data.all[0];
      
      if (M.args.includes("--video") || M.args.includes("-v")) {
        const ytData = await All.YouTube.down(url);
      if (!ytData.data.videoUrl) {
        return await Neko.sendTextMessage(
          M.from,
          "Failed to download the song.",
          M,
        );
      }
        return await Neko.sendVideoMessage(M.from, ytData.data.videoUrl, M);
      } else {
        let yt = new YT(url, "audio");
        let res = await yt.download();
        return await Neko.sendAudioMessage(M.from, res, M);
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  },
};
