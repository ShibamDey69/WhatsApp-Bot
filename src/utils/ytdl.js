import ytdl from 'ytdl-core';
import { readFile, unlink } from 'fs/promises';
import { PassThrough } from 'stream';
import { tmpdir } from 'os';
import { createWriteStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from "axios";
import qs from "qs"; 

const execPromise = promisify(exec);

export default class YTDL {
    constructor(url, type = 'video') {
        this.url = url;
        this.type = type;
    }

    download = async () => {
        try{
        if (this.type === 'audio') {
            const outputStream = new PassThrough();
            ytdl(this.url, {
              filter: "audioonly",
            }).pipe(outputStream);
            outputStream.on('finish', () => {
                outputStream.end();
                outputStream.destroy()
            })
            const buffer = await this.streamToBuffer(outputStream);
            return buffer;
        }

        let audioFilename = `${tmpdir()}/${Math.random().toString(36)}.mp3`;
        let videoFilename = `${tmpdir()}/${Math.random().toString(36)}.mp4`;
        const filename = `${tmpdir()}/${Math.random().toString(36)}.mp4`;
        const audioStream = createWriteStream(audioFilename);
        ytdl(this.url, {
            quality: 'highestaudio'
        }).pipe(audioStream);
        audioFilename = await new Promise((resolve, reject) => {
            audioStream.on('finish', () => resolve(audioFilename));
            audioStream.on('error', (error) => reject(error && console.log(error)));
        });
        const stream = createWriteStream(videoFilename);
        ytdl(this.url, {
            quality:  'highestvideo'
        }).pipe(stream);
        videoFilename = await new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(videoFilename));
            stream.on('error', (error) => reject(error && console.log(error)));
        });
        await execPromise(`ffmpeg -i ${videoFilename} -i ${audioFilename} -c:v copy -c:a aac ${filename}`);
        const buffer = await readFile(filename);
        await Promise.all([unlink(videoFilename), unlink(audioFilename), unlink(filename)]);
        return buffer;
        } catch(error) {
            console.log(error);
            throw Error(error);
        }
    }

    streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
      const buffers = [];
      stream.on("data", (chunk) => buffers.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(buffers)));
      stream.on("error", (err) => reject(err));
    });
  };

    tempdl =  async () => {
  try {
    
    const form = {
      k_query: this.url,
      k_page: "home",
      hl: "en",
      q_auto: 0,
    };

     let response = await axios.post(
      "https://in-y2mate.com/mates/analyzeV2/ajax",
      qs.stringify(form),
    );
    let links = response.data.links;
    let linkToken = this.type === "audio" ? links.mp3.mp3128.k : links.mp4.auto.k;
    let vid = response.data.vid;

    const res = await axios.post(
      "https://in-y2mate.com/mates/convertV2/index",
      qs.stringify({
        vid,
        k: linkToken,
      }),
    );
    let {data } = await axios.get(res.data.dlink, {
      responseType: "arraybuffer",
    })
    return data;
  } catch (error) {
    throw new Error(error);
  }
};
    
}
