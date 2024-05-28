import ytdl from 'ytdl-core';
import { PassThrough } from 'stream';
import { exec } from 'child_process';
import { join } from 'path';
import { createWriteStream,createReadStream } from 'fs';
import { tmpdir } from 'os';
class YT {
  constructor(url, type = 'video') {
    this.url = url;
    this.type = type;
  }

  download = async (quality = 'low') => {
    try {
      if (this.type === 'audio' || quality === 'low') {
        const outputStream = new PassThrough();
        ytdl(this.url, {
          filter: 'audioonly',
        }).pipe(outputStream);

        const buffer = await this.streamToBuffer(outputStream);
        return buffer;
      }
      const info = await ytdl.getInfo(this.url);
    if(info.videoDetails.lengthSeconds < 150) {
      const videoStream = new PassThrough();
        ytdl(this.url,{
          filter: format => format.qualityLabel=== '480p' || format.qualityLabel === '720p' || format.qualityLabel === '1080p'
        }).pipe(videoStream);
      const audioStream = new PassThrough();
        ytdl(this.url, {
          filter: 'audioonly',
        }).pipe(audioStream);
// Set the path for the ffmpeg binary
        const buffer = await this.streamToBuffer(await this.mergeStreams(videoStream, audioStream));
        return buffer;
      } else {
      const videoStream = new PassThrough();
      
      ytdl(this.url, { filter: format => format.qualityLabel=== '360p' && format.hasAudio === true && format.hasVideo === true}).pipe(videoStream);
      
      const buffer = await this.streamToBuffer(videoStream);
      return buffer;
      }
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  };

  mergeStreams = async (videoStream, audioStream) => {
    return new Promise(async(resolve, reject) => {
      const tempDir = tmpdir();
      const audioFilePath = join(tempDir, 'audio.mp3');
      const videoFilePath = join(tempDir, 'video.mp4');
      const mergedFilePath = join(tempDir, 'merged.mp4');
      audioStream.pipe(createWriteStream(audioFilePath)).on('finish', () => {
        videoStream.pipe(createWriteStream(videoFilePath)).on('finish',() => {
          const ffmpegCommand = `ffmpeg -i ${videoFilePath} -i ${audioFilePath} -c:v copy -c:a aac ${mergedFilePath}`;
          exec(ffmpegCommand, (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            const mergedStream = createReadStream(mergedFilePath);
            resolve(mergedStream);
          });
        });
      });
    });
  };
  streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
      const buffers = [];
      stream.on('data', (chunk) => buffers.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(buffers)));
      stream.on('error', (err) => reject(err));
    });
  };
}

export default YT;

