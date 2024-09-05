import {
  makeWASocket,
  useMultiFileAuthState,
  downloadMediaMessage,
  generateWAMessageFromContent,
} from "@whiskeysockets/baileys";
import fs from "fs";
import Pino from "pino";
import EventEmitter from "events";
import { fileTypeFromBuffer } from "file-type";
import Connection from "../utils/connection.js";
import loadCommands from "../utils/commands.js";
import Log from "../utils/logs.js";
import pkg from "@whiskeysockets/baileys";
const { proto } = pkg;
const META_DATA = JSON.parse(fs.readFileSync("src/config.json", "utf-8"));
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
  }
  async connect() {
    if (!fs.existsSync("Auth-Info")) {
      await fs.promises.mkdir("Auth-Info");
    }
    const clearState = async () => {
      await fs.promises.rm(`./Auth-Info/${this.socketConfig.session}`, {
        recursive: true,
      });
      process.exit(0);
    };
    const { saveCreds, state } = await useMultiFileAuthState(
      `./Auth-Info/${this.socketConfig.session}`,
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
        let code = await Neko.requestPairingCode(process.argv[2]);
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
    this.prefix = META_DATA.prefix;
    this.commands = await loadCommands();
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

  sendImageMessage = async (from, url, m, caption = "Neko") => {
    try {
      return await this.sendMessage(
        from,
        {
          image: typeof url === "string" ? { url } : url,
          caption,
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
        { video: typeof url === "string" ? { url } : url },
        { quoted: m },
      );
    } catch (error) {
      throw new Error(error);
    }
  };

  sendAudioMessage = async (from, url, m, ppt) => {
    try {
      return await this.sendMessage(
        from,
        {
          audio: typeof url === "string" ? { url } : url,
          mimetype: "audio/mpeg",
          ptt: ppt ?? false,
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

  sendTextButton = async (from, text, text2, text3, m) => {
    try {
      let msg = generateWAMessageFromContent(
        from,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({
                  text,
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: `© ${META_DATA.BotName} 2024`,
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                  title: "",
                  subtitle: "Cat is Love",
                  hasMediaAttachment: false,
                }),
                nativeFlowMessage:
                  proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: [
                      {
                        name: "quick_reply",
                        buttonParamsJson: `{"display_text":${text2},"id":${text3}}`,
                      },
                    ],
                  }),
              }),
            },
          },
        },
        {},
      );

      await this.relayMessage(
        from,
        msg.message,
        {
          messageId: msg.key.id,
        },
        { quoted: m },
      );
    } catch (error) {
      throw new Error(error);
    }
  };

  sendButton = async (from, text, button = [], m) => {
    try {
      let msg = generateWAMessageFromContent(
        from,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({
                  text,
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                  text: `© ${META_DATA.BotName} 2024`,
                }),
                header: proto.Message.InteractiveMessage.Header.create({
                  title: "",
                  subtitle: "Cat is Love",
                  hasMediaAttachment: false,
                }),
                nativeFlowMessage:
                  proto.Message.InteractiveMessage.NativeFlowMessage.create({
                    buttons: [...button],
                  }),
              }),
            },
          },
        },
        {},
      );

      await this.relayMessage(
        from,
        msg.message,
        {
          messageId: msg.key.id,
        },
        { quoted: m },
      );
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
