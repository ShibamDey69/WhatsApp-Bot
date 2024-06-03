import ytdl from 'ytdl-core';
import { readFile, unlink } from 'fs/promises';
import { PassThrough } from 'stream';
import { tmpdir } from 'os';
import { createWriteStream } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

class YT {
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
}

export default YT;