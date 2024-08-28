import converter from "../../utils/converter.js";
export default {
  name: "toaudio",
  aliases: ["tomp3", "adch"],
  desc: "Converts a video or audio to different version of audio",
  category: "converter",
  usage: `tomp3 <args> qoute/tag the video/audio`,
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
          "Please provide the type of audio you want to convert to.For more info --list",
          M,
        );
      }
      if (!M.isQuoted) {
        return await Neko.sendTextMessage(
          M.from,
          "Please quote the video or audio you want to convert to audio.",
          M,
        );
      }
      if (M.quoted.mtype !== "audio" && M.quoted.mtype !== "video") {
        return await Neko.sendTextMessage(
          M.from,
          "Please quote the video or audio you want to convert to audio.",
          M,
        );
      }
      if (M.args.toLowerCase().includes("--list")) {
        return await Neko.sendTextMessage(
          M.from,
          "Available audio types: normal, nightcore, bassboost, lofi",
          M,
        );
      }
      const media = await Neko.downloadMediaContent(Neko, M.quoted);
      let audio;
      switch (M.args.toLowerCase()) {
        case "normal":
          audio = await converter(media.data, "mp3");
          break;
        case "nightcore":
          audio = await converter(media.data, "mp3", [
            "-af",
            "asetrate=44100*1.15,aresample=44100,atempo=1.15",
          ]);
          break;
        case "bassboost":
          audio = await converter(media.data, "mp3", [
            "-af",
            "bass=g=30, dynaudnorm=f=150",
          ]);
          break;
        case "lofi":
          audio = await converter(media.data, "mp3", [
            "-af",
            "aformat=sample_fmts=s16:sample_rates=22050, lowpass=f=1200, highpass=f=100, afftdn=nf=-65, aecho=0.8:0.88:60:0.1, atempo=0.88, equalizer=f=300:t=q:w=1.5:g=5, equalizer=f=1000:t=q:w=1.5:g=3",
          ]);
          break;
        default:
          await Neko.sendTextMessage(
            M.from,
            "Invalid audio type. Please use --list to see the available audio types.",
            M,
          );
          break;
      }
      return await Neko.sendAudioMessage(M.from, audio, M);
    } catch (error) {
      await Neko.error(error);
    }
  },
};
