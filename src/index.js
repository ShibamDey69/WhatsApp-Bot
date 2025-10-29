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
      await Neko.userDB.getUser(
        `${Neko.user.lid.split(":")[0]}@lid`,
        `${Neko.user.id.split(":")[0]}@s.whatsapp.net`,
        Neko.user.name
      );
      Neko.on("messages", async (m) => messageHandler(Neko, m));
      Neko.on("groups", async (m) => groupHandler(Neko, m));
    }
  } catch (error) {
    console.log(error);
  }
})();
