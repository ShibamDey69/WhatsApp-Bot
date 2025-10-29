import yts from "yt-search";
import YT from "../../utils/ytdl.js";
import axios from "axios";
export default {
  name: "play",
  aliases: ["p"],
  desc: "Play music from youtube",
  category: "converter",
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

      const videos = data.all;
      let { url } = videos[Math.floor(Math.random() * 1)];

      if (M.args.includes("--video") || M.args.includes("-v")) {
        let yt = await YT.ytmp4(url);
        return await Neko.sendVideoMessage(M.from, yt.buffer, M);
      } else {
        let yt = await YT.ytmp3(url);
        return await Neko.sendAudioMessage(M.from, yt.buffer, M, false);
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
