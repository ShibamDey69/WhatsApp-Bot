import yt from "@vreden/youtube_scraper";
import axios from "axios";
 const ytdlp = {
   ytmp3: async (link, quality = 128) => {
     if (!link) {
       return {
         status: false,
         code: 400,
         error: "Please provide a valid YouTube link.",
       };
     }
     try {
       const result = await yt.ytmp3(link, quality);
       if (!result?.download?.url) {
         return {
           status: false,
           code: 404,
           error: "Download URL not found in response.",
         };
       }
       const { data } = await axios.get(result.download.url, {
         responseType: "arraybuffer",
       });

       return {
         ...result,
         buffer: Buffer.from(data),
       };
     } catch (err) {
      console.log(err)
       return {
         status: false,
         code: 500,
         error: err.message || "Unknown error occurred during ytmp3 download.",
       };
     }
   },
   ytmp4: async (link, quality = "480p") => {
     if (!link) {
       return {
         status: false,
         code: 400,
         error: "Please provide a valid YouTube link.",
       };
     }
     try {
       const result = await yt.ytmp4(link, quality);
       if (!result?.download?.url) {
         return {
           status: false,
           code: 404,
           error: "Download URL not found in response.",
         };
       }
       const { data } = await axios.get(result.download.url, {
         responseType: "arraybuffer",
       });
       return {
         ...result,
         buffer: Buffer.from(data),
       };
     } catch (err) {
       return {
         status: false,
         code: 500,
         error: err.message || "Unknown error occurred during ytmp4 download.",
       };
     }
   },
 };
 export default ytdlp;