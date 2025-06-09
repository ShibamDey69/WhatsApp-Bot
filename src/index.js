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
      const ownerNumber = [
        ...process.env.OWNER_NUMBER.split(",").map((v) => v.trim()),
        process.env.PHONE_NUMBER,
      ].map((v) => `${v}@s.whatsapp.net`);
      ownerNumber.forEach(async (v) => {
        await Neko.userDB.getUser(v, Neko.user?.name || "OWNER");
        await Neko.userDB.setMod(v, true);
        await Neko.userDB.setPro(v, true);
        await Neko.userDB.setStatusView(v, true);
      });
      Neko.on("messages", async (m) => messageHandler(Neko, m));

      Neko.on("groups", async (m) => groupHandler(Neko, m));
    }
  } catch (error) {
    console.log(error);
  }
})();
