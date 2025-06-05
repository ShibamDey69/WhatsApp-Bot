import axios from "axios";
import * as cheerio from "cheerio";

async function igdl(url) {
  return new Promise(async (resolve) => {
    try {
      const isValidUrl =
        url.match(
          /(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/,
        ) ||
        url.match(/(https|http):\/\/www.instagram.com\/(p|reel|tv|stories)/gi);

      if (!isValidUrl) {
        return resolve({
          status: false,
          msg: "Link URL not valid",
        });
      }

      const response = await axios.post(
        "https://snapsave.app/action.php?lang=id",
        new URLSearchParams({ url }),
        {
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "content-type": "application/x-www-form-urlencoded",
            origin: "https://snapsave.app",
            referer: "https://snapsave.app/id",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
          },
        },
      );

      const htmlContent = parseSnapsaveResponse(response.data);
      const $ = cheerio.load(htmlContent);
      const results = [];

      if ($("article.media > figure").length || $("table.table").length) {
        const thumbnail = $("article.media > figure").find("img").attr("src");

        $("tbody > tr").each((_, element) => {
          const row = $(element);
          const cells = row.find("td");
          const resolution = cells.eq(0).text();
          const downloadUrl =
            cells.eq(2).find("a").attr("href") ||
            cells.eq(2).find("button").attr("onclick");

          const needsProgressApi = /get_progressApi/gi.test(downloadUrl || "");
          const finalUrl = needsProgressApi
            ? /get_progressApi\('(.*?)'\)/.exec(downloadUrl || "")?.[1] ||
              downloadUrl
            : downloadUrl;

          results.push({
            resolution,
            thumbnail,
            url: finalUrl,
            shouldRender: needsProgressApi,
          });
        });
      } else {
        $(".download-items__thumb").each((_, thumbElement) => {
          const thumbnail = $(thumbElement).find("img").attr("src");

          $(".download-items__btn").each((_, btnElement) => {
            let downloadUrl = $(btnElement).find("a").attr("href");

            if (!/https?:\/\//.test(downloadUrl || "")) {
              downloadUrl = "https://snapsave.app" + downloadUrl;
            }
            results.push({
              thumbnail,
              url: downloadUrl,
            });
          });
        });
      }

      if (!results.length) {
        return resolve("Result Not Found! Check Your URL Now!");
      }

      return resolve(results);
    } catch (error) {
      return resolve("Request Failed With Code 401");
    }
  });
}

function parseSnapsaveResponse(response) {
  const encodedData = extractEncodedData(response);
  if (!encodedData) return response;

  const decodedContent = decodeSnapsaveContent(encodedData);

  return extractFinalHtml(decodedContent);
}

function extractEncodedData(response) {
  const match = response.split("decodeURIComponent(escape(r))}(")[1];
  if (!match) return null;

  return match
    .split("))")[0]
    .split(",")
    .map((item) => item.replace(/"/g, "").trim());
}

function decodeSnapsaveContent(encodedData) {
  const [encoded, _, mapping, offset, radix] = encodedData;

  let result = "";
  let i = 0;

  while (i < encoded.length) {
    let chunk = "";
    while (encoded[i] !== mapping[radix]) {
      chunk += encoded[i];
      i++;
    }

    // Convert all digits to their numeric values
    for (let j = 0; j < mapping.length; j++) {
      chunk = chunk.replace(new RegExp(mapping[j], "g"), j.toString());
    }

    const charCode = parseInt(chunk, radix) - parseInt(offset);
    result += String.fromCharCode(charCode);
    i++;
  }

  return decodeURIComponent(encodeURIComponent(result));
}

function extractFinalHtml(decodedContent) {
  const parts = decodedContent.split(
    'getElementById("download-section").innerHTML = "',
  );
  if (parts.length < 2) return decodedContent;

  return parts[1]
    .split('"; document.getElementById("inputData").remove(); ')[0]
    .replace(/\\(\\)?/g, "");
}

export default igdl;
