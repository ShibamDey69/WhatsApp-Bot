import 'dotenv/config'
import NekoEmit from "./connect/connect.js";
import messageHandler from "./Handlers/message.js";
//import callHandler from "./Handlers/call.js";
import groupHandler from "./Handlers/group.js";
import mongoose from "mongoose";

(async () => {
  try {
    let mongo = await mongoose.connect(process.env.MONGODB);
    if (mongo) {
      const Neko = new NekoEmit({
        session: process.env.SESSION_ID,
        printQRInTerminal: false,
      });

      await Neko.connect();

      Neko.on("messages", async (m) => messageHandler(Neko, m));

      Neko.on("groups", async (m) => groupHandler(Neko, m));
    }

    //Neko.on("call", callHandler);

    //Neko.on("status", statusHandler);
  } catch (error) {
    console.log(error);
  }
})();
