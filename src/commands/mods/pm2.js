import { exec } from "child_process";
import { promisify } from "util";
export default {
  name: "pm2",
  aliases: ["pm2"],
  desc: "Restart the bot",
  category: "mods",
  usage: `pm2`,
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isOwner: true,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      await Neko.sendTextMessage(M.from, "*Executing Command...*", M);
      let asyncExec = promisify(exec);
      await asyncExec(`pm2 ${M.args}`);
      return await Neko.sendTextMessage(M.from, "*Command Executed...*", M);
    } catch (error) {
      await Neko.error(error);
    }
  },
};
