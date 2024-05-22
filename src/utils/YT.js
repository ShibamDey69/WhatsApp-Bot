import ytdl from 'youtubedl-core';
import { readFile, unlink } from 'fs/promises';
import {createWriteStream} from 'fs';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

class YT {
    constructor(url, type = 'video') {
        this.url = url;
        this.type = type;
    }

    

    download = async (quality = 'low') => {
        if (this.type === 'audio' || quality === 'low') {
            let filename = `${tmpdir()}/${Math.random().toString(36)}.${this.type === 'audio' ? 'mp3' : 'mp4'}`;
            const stream = createWriteStream(filename);
            ytdl(this.url, {
                quality: this.type === 'audio' ? 'highestaudio' : 'highest'
            }).pipe(stream);
            filename = await new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(filename));
                stream.on('error', (error) => reject(error && console.log(error)));
            });
            const buffer = await readFile(filename);
            await unlink(filename);
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
            quality: quality === 'high' ? 'highestvideo' : 'lowestvideo'
        }).pipe(stream);
        videoFilename = await new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(videoFilename));
            stream.on('error', (error) => reject(error && console.log(error)));
        });
        await execPromise(`ffmpeg -i ${videoFilename} -i ${audioFilename} -c:v copy -c:a aac ${filename}`);
        const buffer = await readFile(filename);
        await Promise.all([unlink(videoFilename), unlink(audioFilename), unlink(filename)]);
        return buffer;
    }
}

export default YT;