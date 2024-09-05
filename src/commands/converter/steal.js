import { Sticker, StickerTypes } from "@shibam/sticker-maker";
export default {
  name: "steal",
  alias: ["stealsticker", "sticker", "stiker"],
  desc: "Steal sticker from other chat",
  category: "converter",
  usage: `steal <Pack|Author>`,
  cooldown: 5,
  isOwner: false,
  isAdmin: false,
  isBotAdmin: false,
  isPro: false,
  isGroup: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
       if (M.quoted?.mtype !== "sticker") {
         return await Neko.sendTextMessage(
           M.from,
           "Please reply to a sticker message to steal the sticker",
           M);
       }
       if (M.quoted.mtype === "sticker") {
         let buffer = await Neko.downloadMediaContent(
           Neko,
           M.quoted,
         );
         let sticker = new Sticker(buffer.data, {
           pack: M.args.split("|")[0] ?? "",
           author: M.args.split("|")[1] ?? "Shibam",
           category: ["😂", "😜"],
           quality: 80,
           type: StickerTypes.DEFAULT
         });
         let buff = await sticker.toBuffer();
         await Neko.sendStickerMessage(M.from, buff, M);
       }
    } catch (error) {
       await Neko.error(error);
    }
  }
}