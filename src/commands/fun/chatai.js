import { Hercai } from "hercai";
const hercai = new Hercai();
export default {
  name: "chatai",
  aliases: ["ai", "gpt"],
  desc: "Chat with AI",
  category: "fun",
  usage: `chatai <prompt>`,
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      const prompt = M.args;
      if (!prompt) {
        return await Neko.sendTextMessage(
          M.from,
          "Please provide a prompt.",
          M,
        );
      }
      const [res] = await Promise.all([
        hercai.betaQuestion({ content: prompt, user: M.sender }),
      ]);

      if (!res.reply) {
        return await Neko.sendTextMessage(
          M.from,
          "Failed to generate the message.",
          M,
        );
      }
      return await Neko.sendTextMessage(M.from, `*${res.reply}*`, M);
    } catch (error) {
      await Neko.error(error);
    }
  },
};
