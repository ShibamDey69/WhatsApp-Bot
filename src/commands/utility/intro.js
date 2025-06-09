export default {
  name: "intro",
  aliases: ["introduction", "i", "nigga"],
  desc: "Get the introduction of the bot",
  category: "Utility",
  usage: `intro`,
  cooldown: 1,
  isAdmin: false,
  isGroup: false,
  isBotAdmin: false,
  isMod: false,
  isPro: false,
  isOwner: false,
  run: async (Neko, M) => {
    try {
      const videoUrl =
        "https://screenpal.com/content/video/download/cT1QidnXiUk";
      const videoCaption = `Name: Ryuken Ishida
Age: 48
Personality: Cold, logical, and fiercely disciplined — a man who lets reason rule over emotion.`;
      const videoMessage = {
        video: { url: videoUrl },
        caption: videoCaption,
        gifPlayback: true,
        mimetype: "video/mp4",
        fileName: "intro.mp4",
      };

      await Neko.sendMessage(M.from, videoMessage, {
        quoted: M,
      });
    } catch (error) {
      await Neko.error(error);
    }
  },
};
