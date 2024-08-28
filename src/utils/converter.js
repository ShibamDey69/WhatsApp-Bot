import fs from "fs/promises";
import path from "path";
import os from "os";
import { spawn } from "child_process";

async function converter(buffer, outputExt = "mp3", arg = []) {
  try {
    const tmpDir = os.tmpdir();
    const tmp = path.join(tmpDir, `${new Date().getTime()}.wav`);
    const out = `${tmp}.${outputExt}`;
    await fs.writeFile(tmp, buffer);

    const args = ["-y", "-i", tmp, ...arg, out];

    const process = spawn("ffmpeg", args);

    const code = await new Promise((resolve, reject) => {
      process.on("error", reject);
      process.on("close", resolve);
    });

    await fs.unlink(tmp);
    if (code !== 0) throw new Error(`FFmpeg process exited with code ${code}`);
    const result = await fs.readFile(out);
    await fs.unlink(out);
    return result;
  } catch (error) {
    throw Error(error);
  }
}

export default converter;
