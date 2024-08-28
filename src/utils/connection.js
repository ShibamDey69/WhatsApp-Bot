import { Boom } from "@hapi/boom";
import { DisconnectReason } from "@whiskeysockets/baileys";
import clc from "cli-color";
import figlet from "figlet";
let tryConnect = 0;

async function Connection(update, This, clearState) {
  const { lastDisconnect, connection } = update;
  if (connection === "connecting") {
    tryConnect++;
    console.log(
      clc.red(
        figlet.textSync("Neko", {
          font: "Standard",
          horizontalLayout: "default",
          verticalLayout: "default",
          width: 80,
          whitespaceBreak: true,
        }),
      ),
    );
  } else if (connection === "close") {
    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
    switch (reason) {
      case DisconnectReason.restartRequired:
        This.log("status", `${reason}`, "Restarting...");
        This.connect();

        break;
      case DisconnectReason.connectionLost:
        This.log("status", `${reason}`, "Connection Lost! Reconnecting...");
        This.connect();

        break;
      case DisconnectReason.connectionClosed:
        This.log("status", `${reason}`, "Connection Closed! Reconnecting...");
        This.connect();

        break;
      case DisconnectReason.connectionReplaced:
        This.log("status", `${reason}`, "Connection Replaced! Reconnecting...");
        This.connect();

        break;
      case DisconnectReason.timedOut:
        This.log("status", `${reason}`, "Timed Out! Reconnecting...");
        await clearState();
        break;
      case DisconnectReason.loggedOut:
        This.log(
          "status",
          `${reason}`,
          "Session has been Logged Out! Please re-scan QR!",
        );
        await clearState();
        break;
      case DisconnectReason.multideviceMismatch:
        if (tryConnect < 2) {
          tryConnect++;
          This.log(
            "status",
            `${reason}`,
            "Multidevice Mismatch! Try to reconnecting...",
          );
          This.connect();
        } else {
          This.log(
            "status",
            `${reason}`,
            "Multidevice Mismatch! Please re-scan QR!",
          );
          await clearState();
          process.exit(0);
        }

        break;
      case DisconnectReason.badSession:
        if (tryConnect < 2) {
          tryConnect++;
          This.log(
            "status",
            `${reason}`,
            "Bad Session! Try to reconnecting...",
          );
          This.connect();
        } else {
          This.log("status", `${reason}`, "Bad Session! Please re-scan QR!");
          await clearState();
          process.exit(0);
        }

        break;
      default:
        if (tryConnect < 2) {
          tryConnect++;
          This.log(
            "status",
            `${reason}`,
            "Another Reason! Try to reconnecting...",
          );
          This.connect();
        } else {
          This.log("status", `${reason}`, "Another Reason! Try to re-scan QR!");
          await clearState();
          process.exit(0);
        }

        break;
    }
  } else if (connection === "open") {
    tryConnect = 0;
    /** Logger */
    This.log("connect", "Successfully Connected!");
    This.log("connect", "Author : NekoSenpai69");
    This.log(
      "connect",
      `Name    : ${This?.user?.name !== undefined ? This?.user?.name : "Neko"}`,
    );
    This.log("connect", `Number  : ${This?.user?.id?.split(":")[0]}`);
    This.log("connect", `Version : v6.7.7`);
    This.log(
      "connect",
      `Time : ${new Date().toLocaleString("id", { timeZone: "Asia/Kolkata" })}`,
    );
    This.log("info", "Neko is connected!");
    if (This.commands) {
      This.log("info", "Commands are loaded!");
    }
  }
}
export default Connection;
