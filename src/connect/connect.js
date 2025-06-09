import {
  makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import fs from "fs";
import Pino from "pino";
import EventEmitter from "events";
import { fileTypeFromBuffer } from "file-type";
import Connection from "../utils/connection.js";
import loadCommands from "../utils/commands.js";
import Log from "../utils/logs.js";
import { groupDBFunc, userDBFunc } from "../db/index.js";
const loggerOptions = {
  level: "silent",
};
const logger = Pino(loggerOptions).child({});

class NekoEmit extends EventEmitter {
  constructor(config) {
    super();
    this.socketConfig = config;
    this.time = new Date();
    this.logger = logger;
    this.groupDB = groupDBFunc;
    this.userDB = userDBFunc;
    this.from = null;
    this.mess = null;
    this.commands = null;
  }

  async connect() {
    if (!fs.existsSync("Auth_Info")) {
      await fs.promises.mkdir("Auth_Info");
    }
    const clearState = async () => {
      await fs.promises.rm(`./Auth_Info/${this.socketConfig.session}`, {
        recursive: true,
      });
      process.exit(0);
    };
    const { saveCreds, state } = await useMultiFileAuthState(
      `./Auth_Info/${this.socketConfig.session}`,
    );
    const Neko = makeWASocket({
      ...this.socketConfig,
      logger,
      auth: state,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      printQRInTerminal: false,
    });

    if (!Neko.authState.creds.registered) {
      setTimeout(async () => {
        let code = await Neko.requestPairingCode(process.env.PHONE_NUMBER);
        console.log(`Pair Code: ${code}`);
      }, 4000);
    }

    Neko.ev.on("connection.update", async (update) =>
      Connection(update, this, clearState),
    );

    Neko.ev.on("creds.update", saveCreds);

    Neko.ev.on("messages.upsert", async ({ messages }) => {
      for (const mess of messages) {
        this.from = mess.key.remoteJid;
        this.mess = mess;
        if (
          mess?.message?.protocolMessage?.type !== 3 ||
          !mess?.messageStubType
        ) {
          this.emit("messages", mess);
        }
      }
    });

    Neko.ev.on("group-participants.update", async (update) => {
      this.emit("groups", update);
    });

    for (let event of [
      "messaging-history.set",
      "chats.upsert",
      "chats.update",
      "chats.phoneNumberShare",
      "presence.update",
      "contacts.upsert",
      "contacts.update",
      "messages.delete",
      "messages.update",
      "messages.media-update",
      "messages.reaction",
      "message-receipt.update",
      "groups.update",
      "blocklist.set",
      "blocklist.update",
      "labels.edit",
      "labels.association",
    ])
      Neko.ev.removeAllListeners(event);

    for (let key of Object.keys(Neko)) {
      if (!key.includes("ev") && !key.includes("ws")) {
        this[key] = Neko[key];
      }
    }
    this.commands = await loadCommands();
    return true;
  }

  log = (type, text, text2) => Log(type, text, text2, this);

  sendStickerMessage = async (from, data, m) => {
    try {
      return await this.sendMessage(from, { sticker: data }, { quoted: m });
    } catch (error) {
      throw new Error(error);
    }
  };

  sendTextMessage = async (from, text, m) => {
    try {
      return await this.sendMessage(from, { text }, { quoted: m });
    } catch (error) {
      throw new Error(error);
    }
  };

  sendReactMessage = async (from, text = "♥️", m) => {
    try {
      return await this.sendMessage(from, {
        react: { text: text, key: m.key },
      });
    } catch (error) {
      throw new Error(error);
    }
  };

  sendEditMessage = async (from, text, m) => {
    try {
      return await this.sendMessage(from, {
        text,
        edit: m.key,
      });
    } catch (error) {
      throw new Error(error);
    }
  };

  sendImageMessage = async (from, url, m) => {
    try {
      return await this.sendMessage(
        from,
        {
          image: typeof url === "string" ? { url } : url,
          caption: "> Developed By *ShibamDey69*",
        },
        { quoted: m },
      );
    } catch (error) {
      throw new Error(error);
    }
  };

  sendVideoMessage = async (from, url, m) => {
    try {
      return await this.sendMessage(
        from,
        {
          video: typeof url === "string" ? { url } : url,
          caption: "> Developed By *ShibamDey69*",
        },
        { quoted: m },
      );
    } catch (error) {
      throw new Error(error);
    }
  };

  sendAudioMessage = async (from, url, m, ppt, contextInfo = {}) => {
    try {
      return await this.sendMessage(
        from,
        {
          audio: typeof url === "string" ? { url } : url,
          mimetype: "audio/mpeg",
          ptt: ppt ?? false,
          contextInfo: {
            ...contextInfo,
          },
        },
        { quoted: m },
      );
    } catch (error) {
      throw new Error(error);
    }
  };

  sendDocumentMessage = async (from, url, m) => {
    try {
      return await this.sendMessage(
        from,
        {
          document: typeof url === "string" ? { url } : url,
          caption: "> Developed By *ShibamDey69*",
          mimetype: "application/pdf",
          fileName: `${~~(Math.random() * 1e9)}.pdf`,
        },
        { quoted: m },
      );
    } catch (error) {
      throw new Error(error);
    }
  };

  sendMentionMessage = async (from, text, mentions, m) => {
    try {
      return await this.sendMessage(from, { text, mentions }, { quoted: m });
    } catch (error) {
      throw new Error(error);
    }
  };

  downloadMediaContent = async (Neko, M) => {
    try {
      const buffer = await downloadMediaMessage(
        M,
        "buffer",
        {},
        {
          reuploadRequest: Neko.updateMediaMessage,
        },
      );
      const dataType = await fileTypeFromBuffer(buffer);
      return {
        data: buffer,
        mime: dataType.mime,
        ext: dataType.ext,
      };
    } catch (error) {
      throw Error("Failed to download media content");
    }
  };

  error = async (err) => {
    console.log(err);
    throw new Error(err);
  };
}
export default NekoEmit;
