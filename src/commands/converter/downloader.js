import { fileTypeFromBuffer } from "file-type";
import insta from "instagram-url-direct";
import axios from "axios";
import YT from "../../utils/ytdl.js";
export default {
  name: "download",
  aliases: ["dl", "down"],
  desc: "Download media from various sources",
  category: "converter",
  usage: `downloader <url>`,
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      const args =
        M.args.includes("--video") || M.args.includes("-v")
          ? M.args.replace("--video", "").replace("-v", "")
          : M.args;
      const isValidUrl = (url) => {
        let urlPattern = new RegExp(
          "^(https?:\\/\\/)?" +
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
            "((\\d{1,3}\\.){3}\\d{1,3}))" +
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
            "(\\?[;&a-z\\d%_.~+=-]*)?" +
            "(\\#[-a-z\\d_]*)?$",
          "i",
        );
        return !!urlPattern.test(url);
      };
      let urlCheck = (url) => {
        const instaRegex = new RegExp(
          "https?:\\/\\/(?:www\\.)?instagram\\.com\\/(?:p|tv|reel)\\/[\\w-]+\\/?",
        );
        const ytRegex = "youtu";
        if (instaRegex.test(url)) {
          return "insta";
        } else if (url.includes(ytRegex)) {
          return "yt";
        } else {
          return false;
        }
      };

      if (!isValidUrl) {
        return await Neko.sendTextMessage(
          M.from,
          "Please provide a valid URL.",
          M,
        );
      }
      const whichUrl = urlCheck(args);

      if (whichUrl === "insta") {
        const data = await insta(args);
        if (!data.url_list?.length) {
          return await Neko.sendTextMessage(
            M.from,
            "Failed to download media from the provided URL.",
            M,
          );
        }
        data?.url_list.forEach(async (url) => {
          let res = await axios.get(url, {
            responseType: "arraybuffer",
          });
          if (res.status !== 200) {
            return await Neko.sendTextMessage(
              M.from,
              "Failed to download media from the provided URL.",
              M,
            );
          }

          let type = await fileTypeFromBuffer(res.data);

          if (type.mime.includes("video")) {
            return await Neko.sendVideoMessage(M.from, res.data, M);
          } else {
            return await Neko.sendImageMessage(M.from, res.data, M);
          }
        });
        return;
      } else if (whichUrl === "yt") {
        if (M.args.includes("--audio") || M.args.includes("-a")) {
          let yt = new YT(args, "audio");
          let res = await yt.download();
          return await Neko.sendAudioMessage(M.from, res, M);
        } else {
          let yt = new YT(args, "video");
          let res = await yt.download();
          return await Neko.sendVideoMessage(M.from, res, M);
        }
      } else {
        return await Neko.sendTextMessage(M.from, "*Inavlid Url Provided!*", M);
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
