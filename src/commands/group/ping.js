export default {
  name: "ping",
  alias: ["tagall","tag"],
  desc: "Check the bot's ping",
  category: "group",
  usage: `ping <Message>`,
  cooldown: 5,
  isAdmin: true,
  isBotAdmin: true,
  isGroup: true,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      const participants = M.groupMeta.participants.map((v) => v.id).filter((v) => v !== M.sender);
      const args = M.args || M.quoted.text;
      const hidden = args?.includes("--hidden") || args?.includes("-h");
      const argument = hidden? args?.replace("--hidden", "")?.replace("-h", "") : args;
      const arg = argument ?? `*No Text Provided*`;
      let text =  `📬 *Message: ${arg?.trim()}*\n💬 *Group:* ${
            M.groupMeta.subject
        }\n👥 *Members:* ${participants.length}\n📣 *Tagger: @${
            M.sender.split('@')[0]
        }*\n📧 *Tags:* ${hidden ? '*[HIDDEN]*' : `\n${participants.map((v) => '@' + v.split('@')[0]).join('\n')}`}`;
        return await Neko.sendMentionMessage(M.from, text,[...participants,M.sender], M);
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  },
}