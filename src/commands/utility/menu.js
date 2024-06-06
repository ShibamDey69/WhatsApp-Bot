export default {
  name: "menu",
  aliases: ["help", "h"],
  desc: "Displays the menu",
  category: "Utility",
  usage: `menu`,
  cooldown: 5,
  isAdmin: false,
  isGroup: false,
  isBotAdmin: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      // Initial menu text with bot name and user information
      let text = `\n*╭─「 (づ￣ ³￣)づ 」*
*│ NAME:* ${Neko.user.name}
*│ USER: @${M.sender.split("@")[0]}*
*│ PREFIX:* "${M.prefix}"
*│ DEV:* *Neko-Kun*
*╰────────────┈平和* \n\n𝐓𝐡𝐞𝐬𝐞 𝐚𝐫𝐞 𝐭𝐡𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬 𝐲𝐨𝐮 𝐜𝐚𝐧 𝐮𝐬𝐞~ ツ\n`;

      let commands = Array.from(Neko.commands.values());
      let categories = [...new Set(commands.map((cmd) => cmd.category))];

      for (let category of categories) {
        text += `\n> *${category.toUpperCase()}*\n❐ _`;
        let uniqueCommands = new Set();

        for (let cmd of commands.filter(
          (cmd) => cmd.category.toLowerCase() === category.toLowerCase(),
        )) {
          uniqueCommands.add(cmd.name);
        }
        text += `${[...uniqueCommands].join(", ")}_\n`;
      }

      text += `\n\n> ⚠️ _*Note:* Use ${M.prefix}info <command_name> for more info on a specific command. Example: *${M.prefix}info menu*_`;

      let pics = [
        "https://i.waifu.pics/cjcIyzs.jpg",
        "https://i.waifu.pics/aV3iZgK.jpg",
      ];
      let pic = pics[Math.floor(Math.random() * pics.length)];
      // Send the menu text as a message
      await Neko.sendMessage(M.from, {
        image: { url: pic },
        caption: text,
        mentions: [M.sender],
      });
    } catch (error) {
      console.error(error);
      throw new Error("An error occurred while displaying the menu.");
    }
  },
};
