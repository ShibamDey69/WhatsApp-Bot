import axios from "axios";

const ytdl = {
  config: {
    baseUrl: "https://p.oceansaver.in",
    supportedAudio: ["mp3", "m4a", "opus", "webm"],
    supportedVideo: ["144", "240", "360", "480", "720", "1080"],
  },

  validate: (format, type) => {
    if (type === "audio" && !ytdl.config.supportedAudio.includes(format))
      return false;
    if (type === "video" && !ytdl.config.supportedVideo.includes(format))
      return false;
    return true;
  },

  request: async (url, format, type) => {
    try {
      const encodedUrl = encodeURIComponent(url);
      const { data } = await axios.get(
        `${ytdl.config.baseUrl}/ajax/download.php?format=${format}&url=${encodedUrl}`
      );

      if (!data.success || !data.id) {
        return {
          status: false,
          code: 500,
          error: "Failed to retrieve task ID from OceanSaver.",
        };
      }

      return {
        status: true,
        code: 200,
        taskId: data.id,
        type,
        quality: type === "audio" ? format : `${format}p`,
      };
    } catch (error) {
      return {
        status: false,
        code: 500,
        error: `Request error: ${error.message}`,
      };
    }
  },

  convert: async (taskId) => {
    try {
      const { data } = await axios.get(
        `${ytdl.config.baseUrl}/api/progress?id=${taskId}`
      );
      return data;
    } catch (error) {
      return {
        success: false,
        message: `Convert error: ${error.message}`,
      };
    }
  },

  repeatRequest: async (taskId, type, quality) => {
    for (let i = 0; i < 20; i++) {
      const response = await ytdl.convert(taskId);
      if (response && response.download_url) {
        const { data: buffer } = await axios.get(response.download_url, {
          responseType: "arraybuffer",
        });

        return {
          status: true,
          code: 200,
          type,
          format: type === "audio" ? quality : "mp4",
          quality: quality,
          buffer: Buffer.from(buffer),
          url: response.download_url,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return {
      status: false,
      code: 504,
      error: "Timeout while waiting for download link.",
    };
  },

  ytmp3: async (link, quality = "mp3") => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "Please provide a valid YouTube link.",
      };
    }

    if (!ytdl.validate(quality, "audio")) {
      return {
        status: false,
        code: 400,
        error: `Invalid audio format. Supported: ${ytdl.config.supportedAudio.join(", ")}`,
      };
    }

    const init = await ytdl.request(link, quality, "audio");
    if (!init.status) return init;

    return await ytdl.repeatRequest(init.taskId, init.type, init.quality);
  },

  ytmp4: async (link, quality = "360") => {
    if (!link) {
      return {
        status: false,
        code: 400,
        error: "Please provide a valid YouTube link.",
      };
    }

    if (!ytdl.validate(quality, "video")) {
      return {
        status: false,
        code: 400,
        error: `Invalid video quality. Supported: ${ytdl.config.supportedVideo.join(", ")}`,
      };
    }

    const init = await ytdl.request(link, quality, "video");
    if (!init.status) return init;

    return await ytdl.repeatRequest(init.taskId, init.type, init.quality);
  },
};

export default ytdl;
