import NekoEmit from "./connect/connect.js";
import messageHandler from "./Handlers/message.js";
//import callHandler from "./Handlers/call.js";
import groupHandler from "./Handlers/group.js";


(async () => {
  try {
  const Neko = new NekoEmit({
    session: "Auth-Info",
    printQRInTerminal: false,
  });

  await Neko.connect();

  Neko.on("messages", async(m)=> messageHandler(Neko,m));

  Neko.on("groups", async(m) => groupHandler(Neko, m));

  //Neko.on("call", callHandler);

  //Neko.on("status", statusHandler);
  } catch (error) {
    console.log(error);
  }
})();
