import fs from "fs";
import retry from "retry";
import sequelizer from "../utils/sequelized.js";
import DB from "../connect/db.js";
// Define the retry function
const groupHandler = async (Neko, m) => {
  let res = await fs.promises.readFile("src/config.json");
  Neko.res = JSON.parse(res);

  const operation = retry.operation({
    retries: 3,
    factor: 3,
    minTimeout: 1000,
    maxTimeout: 4000,
  });

  operation.attempt(async (currentAttempt) => {
    try {
      if (!m || !m.id || !m.action || !m.participants) return;
      let gc_db = new DB.GroupDbFunc();
      const gc = await gc_db.getGroup(m.id);
      switch (m.action && m.author.includes("@s.whatsapp.net")) {
        case "promote":
          if (gc.isReassign) {
            let promoted = m.participants[0];
            let message = Neko.res.response.promotion[
              Math.floor(Math.random() * Neko.res.response.promotion.length)
            ]
              .replace("{x}", `*@${promoted.split("@")[0]}*`)
              .replace("{y}", `*@${m.author?.split("@")[0]}*`);
            await Neko.sendMentionMessage(
              m.id,
              message,
              [m.author, promoted],
              null,
            );
          }
          break;
        case "demote":
          if (gc.isReassign) {
            let demoted = m.participants[0];
            let message2 = Neko.res.response.demotion[
              Math.floor(Math.random() * Neko.res.response.demotion.length)
            ]
              .replace("{x}", `*@${demoted.split("@")[0]}*`)
              .replace("{y}", `*@${m.author?.split("@")[0]}*`);
            await Neko.sendMentionMessage(
              m.id,
              message2,
              [m.author, demoted],
              null,
            );
          }
          break;
        case "add":
          if (gc.isWelcome) {
            let added = m.participants[0];
            let message3 = Neko.res.response.welcome[
              Math.floor(Math.random() * Neko.res.response.welcome.length)
            ]
              .replace("{x}", `*@${added.split("@")[0]}*`)
              .replace("{y}", `*@${m.author?.split("@")[0]}*`);
            await Neko.sendMentionMessage(
              m.id,
              message3,
              [m.author, added],
              null,
            );
          }
          break;
        case "remove":
          if (gc.isWelcome) {
            let removed = m.participants[0];
            let message4 = Neko.res.response.bye[
              Math.floor(Math.random() * Neko.res.response.bye.length)
            ]
              .replace("{x}", `*@${removed.split("@")[0]}*`)
              .replace("{y}", `*@${m.author?.split("@")[0]}*`);
            await Neko.sendMentionMessage(
              m.id,
              message4,
              [m.author, removed],
              null,
            );
          }
          break;
        default:
          break;
      }
    } catch (error) {
      if (error.data === 429) {
        let retryAfter = error.data?.headers?.["retry-after"] * 1000 || 30000;
        if (retryAfter) {
          return await new Promise((resolve) =>
            setTimeout(resolve, retryAfter),
          );
        }
      }
      if (error.data === 403) return;
      if (operation.retry(error)) {
        Neko.log("error", `Attempt ${currentAttempt} failed. Retrying...`);
        if (currentAttempt === 3) {
          Neko.log("error", `Maximum Retry Attempts Reached`);
          return;
        }
      }
      Neko.log("error", `${error}`);
      console.log(error);
    }
  });
};

export default groupHandler;
