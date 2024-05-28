import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export default {
  name: "tomp3",
  alias: ["toaudio"],
  desc: "Converts a video to audio",
  category: "converter",
  usage: `tomp3 qoute/tag the video`,
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      if (!M.isQuoted) {
        return await Neko.sendTextMessage(
          M.from,
          "Please quote the video you want to convert to audio.",
          M,
        );
      }
      const media = await Neko.downloadMediaContent(Neko,M.quoted);
      const audio = await toAudio(media.data);
      await Neko.sendMessage(M.from, { audio: audio, mimetype: "audio/mpeg" }, { quoted: M });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}




async function toAudio(buffer, outputExt = 'mp3') {
  try {
    const tmpDir = os.tmpdir();
    let tmp = path.join(tmpDir, `${new Date().getTime()}.wav`);
    let out = `${tmp}.${outputExt}`;
    await fs.writeFile(tmp, buffer);

    const args = [
      '-y',
      '-i', tmp,
      out
    ];

    const process = spawn('ffmpeg', args);

    const code = await new Promise((resolve, reject) => {
      process.on('error', reject);
      process.on('close', resolve);
    });

    await fs.unlink(tmp);
    if (code !== 0) throw new Error(`FFmpeg process exited with code ${code}`);
    const result = await fs.readFile(out);
    await fs.unlink(out);
    return result;
  } catch (e) {
    throw e;
  }
}
