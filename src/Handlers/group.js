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
    let M = await sequelizer(Neko, m);
    try {
      let gc_db = new DB.GroupDbFunc();
      const gc = await gc_db.getGroup(M?.id, M?.groupMeta?.subject);
      switch (M?.action) {
        case "promote":
          if (gc.isReassign) {
            let promoted = M.participants[0];
            let message = Neko.res.response.promotion[
              ~~(Math.random() * Neko.res.response.promotion.length)
            ]
              .replace("{x}", `*@${promoted.split("@")[0]}*`)
              .replace("{y}", `*@${M?.author?.split("@")[0]}*`);
            await Neko.sendMentionMessage(
              M.id,
              message,
              [M.author, promoted],
              null,
            );
          }
          break;
        case "demote":
          if (gc.isReassign) {
            let demoted = M.participants[0];
            let message2 = Neko.res.response.demotion[
              ~~(Math.random() * Neko.res.response.demotion.length)
            ]
              .replace("{x}", `*@${demoted.split("@")[0]}*`)
              .replace("{y}", `*@${M?.author?.split("@")[0]}*`);
            await Neko.sendMentionMessage(
              M.id,
              message2,
              [M.author, demoted],
              null,
            );
          }
          break;
        case "add":
          if (gc.isWelcome) {
            let added = M.participants[0];
            let message3 = Neko.res.response.welcome[
              ~~(Math.random() * Neko.res.response.welcome.length)
            ]
              .replace("{x}", `*@${added.split("@")[0]}*`)
              .replace("{y}", `*@${M?.author?.split("@")[0]}*`);
            await Neko.sendMentionMessage(
              M.id,
              message3,
              [M.author, added],
              null,
            );
          }
          break;
        case "remove":
          if (gc.isWelcome) {
            let removed = M.participants[0];
            let message4 = Neko.res.response.bye[
              ~~(Math.random() * Neko.res.response.bye.length)
            ]
              .replace("{x}", `*@${removed.split("@")[0]}*`)
              .replace("{y}", `*@${M?.author?.split("@")[0]}*`);
            await Neko.sendMentionMessage(
              M.id,
              message4,
              [M.author, removed],
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
