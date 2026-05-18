import "dotenv/config";
import NekoEmit from "./connect/connect.js";
import messageHandler from "./handlers/message.js";
import groupHandler from "./handlers/group.js";

(async () => {
  try {
    const Neko = new NekoEmit({
      session: process.env.SESSION_ID,
      printQRInTerminal: false,
    });

    let connect = await Neko.connect();
    if (connect) {
      Neko.on("messages", async (m) => messageHandler(Neko, m));
      Neko.on("groups", async (m) => groupHandler(Neko, m));
    }
  } catch (error) {
    console.log(error);
  }
})();
