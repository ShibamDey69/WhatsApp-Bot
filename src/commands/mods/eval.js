export default {
  name: "eval",
  aliases: ["ev"],
  desc: "Evaluate a JavaScript expression",
  category: "mods",
  usage: `eval <expression>`,
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: true,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      const code = M.args;
      if (!code) {
        return await Neko.sendTextMessage(
          M.from,
          "Please provide a JavaScript expression to evaluate.",
          M,
        );
      }
      const result = eval(code);
      if (typeof result === "object") {
        const json = JSON.stringify(result, null, 2);
        return await Neko.sendTextMessage(M.from, `*Result:* ${json}`, M);
      } else {
        return await Neko.sendTextMessage(M.from, `*Result:* ${result}`, M);
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};
