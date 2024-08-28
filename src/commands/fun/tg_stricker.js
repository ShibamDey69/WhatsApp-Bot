import axios from "axios";
import { Sticker, StickerTypes } from "@shibam/sticker-maker"; // ES6

class TelegramScraper {
  constructor(opt) {
    this.chat_url = `https://t.me/s/`;
    this.token = `${opt.token}`;
  }

  async sticker(sticker_pack) {
    try {
      let res = await axios.post(
        `https://api.telegram.org/bot${this.token}/getStickerSet`,
        {
          name: sticker_pack,
        },
      );

      const stickers = res.data?.result;
      const linkPromises = stickers?.stickers.map(async (item) => {
        const pathResponse = await axios.post(
          `https://api.telegram.org/bot${this.token}/getFile`,
          {
            file_id: item.file_id,
          },
        );
        return pathResponse.data?.result;
      });

      const results = await Promise.allSettled(linkPromises);
      const links = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      return {
        name: sticker_pack,
        title: stickers.title,
        is_animated: stickers.is_animated,
        is_video: stickers.is_video,
        stickers: links.map(
          (item) =>
            `https://api.telegram.org/file/bot${this.token}/${item.file_path}`,
        ),
      };
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
const tele = new TelegramScraper({
  token: "6775296123:AAHKESAvVzeJCE9vRT5udQNU9q1lrlUmrDY",
});
export default {
  name: "tg_sticker",
  aliases: ["ts", "tgsticker", "tgsticker"],
  desc: "Converts a text to sticker",
  category: "fun",
  usage: `tg_sticker <text>`,
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
          "Please provide a sticker link.",
          M,
        );
      }

      let regex = /^https:\/\/t\.me\/addstickers\/[a-zA-Z0-9_]+$/;

      if (!regex.test(M.args)) {
        return await Neko.sendTextMessage(
          M.from,
          "Please provide a sticker link.",
          M,
        );
      }

      if (M.isGroup) {
        await Neko.sendTextMessage(M.from, "stickers will be send in dm...", M);
      }

      const text = M.args
        .replaceAll("https://t.me/addstickers/", "")
        .replaceAll("t.me/addstickers/", "");

      const sticker = await tele.sticker(text);
      for (let i = 0; i < sticker.stickers.length; i++) {
        if (sticker.stickers[i].endsWith(".tgs")) {
          return await Neko.sendTextMessage(
            M.from,
            "Sticker format is not available in WhatsApp.",
            M,
          );
        }
        let res = await axios.get(sticker.stickers[i], {
          responseType: "arraybuffer",
        });
        let buffer = Buffer.from(res.data, "utf-8");
        let sticker_data = new Sticker(buffer, {
          pack: "Shibam",
          author: "Neko-MD",
          category: ["🤩", "🎉"],
          quality: 7,
        });

        await Neko.sendStickerMessage(
          M.sender,
          await sticker_data.toBuffer(),
          M,
        );
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
