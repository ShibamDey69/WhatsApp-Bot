import axios from "axios";

class TelegramScraper {
  constructor(opt) {
    this.chat_url = `https://t.me/s/`;
    this.token = `${opt.token}`;
  }

  async sticker(sticker_pack) {
    try {
      let res = await axios.post(`https://api.telegram.org/bot${this.token}/getStickerSet`, {
        name: sticker_pack,
      });

      const stickers = res.data.result;
      const linkPromises = stickers?.stickers.map(async (item) => {
        const pathResponse = await axios.post(`https://api.telegram.org/bot${this.token}/getFile`, {
          file_id: item.file_id,
        });
        return pathResponse.data.result;
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
          (item) => `https://api.telegram.org/file/bot${this.token}/${item.file_path}`
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
  alias: ["tgsticker", "tgsticker", "tgsticker"],
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
      const text = M.args.replaceAll("https://t.me/addstickers/","").replaceAll("t.me/addstickers/","");
      if (M.isGroup) {
        await Neko.sendTextMessage(
          M.from,
        "stickers will be send in dm...",M)
      }
      const sticker = await tele.sticker(text);
      for (let i = 0; i < sticker.stickers.length; i++) {
        if(sticker.stickers[i].endsWith(".webp")){
          await Neko.sendStrickerMessage(M.sender, {url:sticker.stickers[i]}, M);
        }
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  },
}