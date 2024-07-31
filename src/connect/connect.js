import {
  makeWASocket,
  fetchLatestWaWebVersion,
  downloadMediaMessage,
  generateWAMessageFromContent,
  makeInMemoryStore,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import NodeCache from "node-cache";
import fs from "fs";
import Pino from "pino";
import EventEmitter from "events";
import { fileTypeFromBuffer } from "file-type";
import Connection from "../utils/connection.js";
import loadCommands from "../utils/commands.js";
import Log from "../utils/logs.js";
import Authentication from "../connect/auth.js";
import pkg from "@whiskeysockets/baileys";
const { proto } = pkg;
const META_DATA = JSON.parse(fs.readFileSync("src/config.json", "utf-8"));
const loggerOptions = { level: "silent" };
const logger = Pino(loggerOptions).child({
  level: "silent",
});
const msgRetryCounterCache = new NodeCache();
const store = makeInMemoryStore({ logger });

store?.readFromFile("./src/tmp/baileys_store_multi.json");
// save every 10s
setInterval(() => {
  store?.writeToFile("./src/tmp/baileys_store_multi.json");
}, 10_000);

class NekoEmit extends EventEmitter {
  constructor(config) {
    super();
    this.socketConfig = config;
    this.time = new Date();
    this.logger = logger;
  }
  async connect() {
    const SingleAuth = new Authentication(`${this.socketConfig.session}`);
    const { saveCreds, clearState, state } = await SingleAuth.singleFileAuth();

    const { version, isLatest } = await fetchLatestWaWebVersion({});
    const Neko = makeWASocket({
      ...this.socketConfig,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      msgRetryCounterCache,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      version,
      shouldSyncHistoryMessage: true,
      printQRInTerminal: false,
      syncFullHistory: true,
      generateHighQualityLinkPreview: true,
      patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(
          message.buttonsMessage ||
          message.templateMessage ||
          message.listMessage
        );
        if (requiresPatch) {
          message = {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadataVersion: 2,
                  deviceListMetadata: {},
                },
                ...message,
              },
            },
          };
        }
        return message;
      },
      getMessage: async (key) => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid, key.id);
          return msg.message || undefined;
        }
        return {
          conversation: "An error occurred while trying to fetch the message.",
        };
      },
      msgRetryCounterMap: 3,
    });
    store?.bind(Neko.ev);
    if (!Neko.authState.creds.registered) {
      setTimeout(async () => {
        let code = await Neko.requestPairingCode(process.argv[2]);
        console.log(`Pair Code: ${code}`);
      }, 4000);
    }

    Neko.ev.on("connection.update", async (update) =>
      Connection(update, this, version, isLatest, clearState),
    );

    Neko.ev.on("creds.update", saveCreds);

    Neko.ev.on("messages.upsert", async ({ messages }) => {
      for (const mess of messages) {
        this["from"] = mess.key.remoteJid;

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
    return await this.sendMessage(from, { sticker: data}, { quoted: m });
  };

  sendTextMessage = async (from, text, m) => {
    return await this.sendMessage(from, { text }, { quoted: m });
  };

  sendReactMessage = async (from, text = "♥️", m) => {
    return await this.sendMessage(from, { react: { text: text, key: m.key } });
  };

  sendEditMessage = async (from, text, m) => {
    return await this.sendMessage(from, {
      text,
      edit: m.key,
    });
  };

  sendImageMessage = async (from, url, m) => {
    return await this.sendMessage(
      from,
      { image: typeof url === "string" ? { url } : url },
      { quoted: m },
    );
  };

  sendVideoMessage = async (from, url, m) => {
    return await this.sendMessage(
      from,
      { video: typeof url === "string" ? { url } : url },
      { quoted: m },
    );
  };

  sendAudioMessage = async (from, url, m, ppt) => {
    return await this.sendMessage(
      from,
      {
        audio: typeof url === "string" ? { url } : url,
        mimetype: "audio/mpeg",
        ptt: ppt ?? false,
      },
      { quoted: m },
    );
  };

  sendDocumentMessage = async (from, url, m) => {
    return await this.sendMessage(
      from,
      {
        document: typeof url === "string" ? { url } : url,
        mimetype: "application/pdf",
        fileName: `${~~(Math.random() * 1e9)}.pdf`,
      },
      { quoted: m },
    );
  };

  sendMentionMessage = async (from, text, mention, m) => {
    return await this.sendMessage(
      from,
      { text, mentions: mention },
      { quoted: m },
    );
  };

  sendTextButton = async (from, text, text2, text3, m) => {
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
  };
  sendButton = async (from,text, button = [], m) => {
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
                    ...button,
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
  };
  
  downloadMediaContent = async (Neko, M) => {
    try {
      const stream = await downloadMediaMessage(
        M,
        "buffer",
        {},
        {
          reuploadRequest: Neko.updateMediaMessage,
        },
      );
      const dataType = await fileTypeFromBuffer(stream);
      return {
        data: stream,
        mime: dataType.mime,
        ext: dataType.ext,
      };
    } catch (error) {
      throw Error("Failed to download media content");
    }
  };

  error = async (err) => {
    this.log("error", err);
    console.log(err);
    throw new Error(err);
  };
}
export default NekoEmit;
