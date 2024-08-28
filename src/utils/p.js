import axios from "axios";
import { load } from "cheerio";

class Scraper {
  /**
   * Fetch and parse the JSON data from a URL.
   * @param {string} url - The URL to scrape.
   * @returns {Promise<Object>} - The parsed JSON data.
   */
  async fetchJson(url) {
    try {
      const response = await axios.get(url);
      const $ = load(response.data);
      const jsonData = $('script[type="application/ld+json"]').html();
      return jsonData ? JSON.parse(jsonData) : {};
    } catch (error) {
      throw new Error(`Failed to fetch JSON from ${url}: ${error.message}`);
    }
  }

  /**
z   * @param {string} text - The search query.
   * @param {string} number - The search result page number.
   * @returns {Promise<string[]>} - Array of video URLs.
   */
  async search(text = "sex", number = "") {
    try {
      const url = `https://www.xnxx.luxe/search/${text}/${number}`;
      const response = await axios.get(url);
      const $ = load(response.data);
      const videoUrls = [];
      $("div.thumb a").each((i, el) => {
        videoUrls.push("https://www.xnxx.luxe" + $(el).attr("href"));
      });
      return videoUrls;
    } catch (error) {
      throw new Error(
        `Search failed for query "${text}" and page "${number}": ${error.message}`,
      );
    }
  }

  /**
   * Fetch JSON data for the first 10 search results.
   * @param {string} text - The search query.
   * @param {string} number - The search result page number.
   * @returns {Promise<Object[]>} - Array of JSON data objects.
   */
  async fetchMultipleJson(text = "sex", number = "") {
    try {
      const videoUrls = await this.search(text, number);
      const fetchPromises = videoUrls
        .slice(0, 10)
        .map((url) => this.fetchJson(url));
      return Promise.all(fetchPromises);
    } catch (error) {
      throw new Error(`Failed to fetch multiple JSON data: ${error.message}`);
    }
  }

  /**
   * Fetch JSON data for a random search result.
   * @param {string} text - The search query.
   * @param {string} number - The search result page number.
   * @returns {Promise<Object>} - The JSON data object.
   */
  async fetchRandomJson(text = "sex") {
    try {
      let number = 0;
      const videoUrls = await this.search(text, number);
      const randomUrl = videoUrls[Math.floor(Math.random() * 7) + 1];
      return this.fetchJson(randomUrl);
    } catch (error) {
      throw new Error(`Failed to fetch random JSON data: ${error.message}`);
    }
  }
}

export default Scraper;
