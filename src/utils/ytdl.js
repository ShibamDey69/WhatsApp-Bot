import axios from "axios";
import qs from "qs";

export default class YTDL {
  constructor(url, type = "video") {
    this.url = url;
    this.type = type;
  }

  progress = async (id) => {
    try {
      let download_url = (
        await axios.get(`https://p.oceansaver.in/ajax/progress.php?id=${id}`)
      ).data.download_url;
      if (!download_url) return await this.progress(id);
      return download_url;
    } catch (error) {
      throw new Error(error);
    }
  };
  download = async (format = "480") => {
    try {
      let payload = {
        copyright: "0",
        format: this.type === "video" ? format : "mp3",
        url: this.url,
        api: "dfcb6d76f2f6a9894gjkege8a4ab232222",
      };

      let res = await axios.get(
        `https://ab.cococococ.com/ajax/download.php?${qs.stringify(payload)}`,
      );
      let id = res.data.id;
      let download_url = await this.progress(id);
      let response = await axios.get(download_url, {
        responseType: "arraybuffer",
      });
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  };
}
