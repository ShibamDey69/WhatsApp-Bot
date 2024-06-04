import "dotenv/config";
import NekoEmit from "./connect/connect.js";
import messageHandler from "./Handlers/message.js";
import groupHandler from "./Handlers/group.js";

(async () => {
  try {
    const Neko = new NekoEmit({
      session: process.env.SESSION_ID,
      printQRInTerminal: false,
    });

    await Neko.connect();

    Neko.on("messages", async (m) => messageHandler(Neko, m));

    Neko.on("groups", async (m) => groupHandler(Neko, m));
  } catch (error) {
    console.log(error);
  }
})();
