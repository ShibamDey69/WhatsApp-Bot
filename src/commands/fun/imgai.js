import { Hercai } from "hercai";
const hercai = new Hercai();
import axios from "axios";
export default {
  name: "imgai",
  aliases: ["image", "imagine", "img"],
  desc: "Generate an image using AI",
  category: "fun",
  usage: `imgai <prompt> --style/-s=<style_name> --negative/-n=<negative_prompt>`,
  cooldown: 30,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      let negPrompt =
        M.args.includes("-n=") || M.args.includes("--negative=")
          ? M.args.split(M.args.includes("-n=") ? "-n=" : "--negative=")[1]
          : null;
      let imgStyle =
        M.args.includes("-s=") || M.args.includes("--style=")
          ? M.args.split(M.args.includes("-s=") ? "-s=" : "--style=")[1]
          : null;
      let prompt = M.args
        .replace(M.args.includes("-n=") ? "-n=" : "--negative=", "")
        .replace(M.args.includes("-s=") ? "-s=" : "--style=", "")
        .replace(negPrompt, "")
        .replace(imgStyle, "")
        .trim();

      if (!prompt) {
        return await Neko.sendTextMessage(
          M.from,
          "Please provide a prompt.",
          M,
        );
      }
      const [imageUrl] = await Promise.all([
        hercai.drawImage({
          prompt,
          negative_prompt: negPrompt ?? "no blur,no blood",
          sampler: "DPM-Solver" /* Default => DPM-Solver */,
          image_style: imgStyle /* Default => Null */,
          width: 1024 /* Default => 1024 */,
          height: 1024 /* Default => 1024 */,
          steps: 20 /* Default => 20 */,
          scale: 5 /* Default => 5 */,
        }),
      ]);
      if (!imageUrl.url) {
        return await Neko.sendTextMessage(
          M.from,
          "Failed to generate the image.",
          M,
        );
      }
      let { data } = await axios.get(imageUrl.url, {
        responseType: "stream"
      })
      await Neko.sendImageMessage(M.from, data, M);
    } catch (error) {
      await Neko.error(error);
    }
  },
};
