import fs from "fs/promises";
import retry from "retry";
import { getContentType } from "@whiskeysockets/baileys";
import sequilizer from "../utils/sequelized.js";
import FormData from "form-data";
import axios from "axios";
import cooldown from "../utils/cooldown.js";
import DB from "../connect/db.js";
const gc_db = new DB.GroupDbFunc();
const user_db = new DB.UserDbFunc();

class Queue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.filePath = "src/tmp/queueData.json";
  }

  async initialize() {
    try {
      const data = await fs.readFile(this.filePath, "utf8").catch(() => "[]");
      this.queue = JSON.parse(data);
    } catch {
      await this.saveQueueToFile();
    }
  }

  async saveQueueToFile() {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.queue), "utf8");
    } catch (error) {
      console.log(error);
    }
  }

  async enqueue(funcString, ...args) {
    try {
      this.queue.push({ funcString, args });
      await this.saveQueueToFile();
      if (!this.processing) await this.processQueue();
    } catch (error) {
      console.log(error);
    }
  }

  async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const { funcString, args } = this.queue.shift();
      try {
        const func = new Function(
          "retry",
          "sequilizer",
          "cooldown",
          "gc_db",
          "user_db",
          "getContentType",
          "FormData",
          "axios",
          `return ${funcString}`,
        )(
          retry,
          sequilizer,
          cooldown,
          gc_db,
          user_db,
          getContentType,
          FormData,
          axios,
        );
        await func(...args);
        await this.saveQueueToFile();
      } catch (error) {
        this.queue.unshift({ funcString, args });
        await this.saveQueueToFile();
      }
    }
    this.processing = false;
  }
}

const messageQueue = new Queue();
await messageQueue.initialize();

const messageHandler = async (Neko, m) => {
  try {
    const processMessage = async (
      Neko,
      m,
      retry,
      sequilizer,
      cooldown,
      gc_db,
      user_db,
      getContentType,
      FormData,
      axios,
    ) => {
      const operation = retry.operation({
        retries: 2,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 4000,
      });

      const parseMessage = (Neko, m, getContentType) => {
        const messageType = getContentType(m.message);
        const text =
          m.message?.conversation ||
          m.message?.[messageType]?.text ||
          m.message?.[messageType]?.caption ||
          Neko.prefix + m.message?.[messageType]?.selectedId ||
          messageType ||
          "";
        const isCmd = text.toString().startsWith(Neko.prefix);
        const from = m.key.remoteJid;
        const isGroup = from?.endsWith("@g.us");
        const isMe = m.key?.fromMe;
        const sender = isMe
          ? `${Neko?.user?.id?.split(":")[0]}@s.whatsapp.net`
          : isGroup
            ? m.key?.participant
            : from;
        return [messageType, text, isCmd, from, isGroup, sender];
      };

      const handleGroup = async (
        Neko,
        m,
        gc,
        isCmd,
        messageType,
        text,
        from,
        sequilizer,
        sender,
      ) => {
        if (gc.isBanned && isCmd) {
          const M = await sequilizer(Neko, m);
          if (!M.isMod) {
            await Neko.sendTextMessage(
              M.from,
              `This Group *${M?.groupMeta?.subject}* have been banned from using this bot`,
            );
            return true;
          }
        }

        if (gc.isAntilink) {
          const gc_link = text.match(
            /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i,
          );
          if (gc_link) {
            const M = await sequilizer(Neko, m);
            if (!M?.isAdmin && !M?.isMod) {
              if (M?.isBotAdmin) {
                await Neko.sendTextMessage(
                  M.from,
                  "This Group has Antilink enabled. Admin access needed for bot to work.",
                );
                return true;
              }
              await Neko.sendTextMessage(
                M.from,
                "Antilink is active in this group",
              );
              await Neko.sendMessage(M.from, { delete: M.key });
              await Neko.groupParticipantsUpdate(M.from, [M.sender], "remove");
              return true;
            }
          }
        }

        if (
          gc.isAntiNsfw &&
          (messageType === "imageMessage" ||
            messageType === "stickerMessage" ||
            messageType === "documentMessage")
        ) {
          const data = await Neko.downloadMediaContent(Neko, m);
          const res = await NsfwDetector(data);
          if (
            res?.labelName.includes("NSFW") ||
            res?.labelName === "SFW Mildly Suggestive"
          ) {
            await Neko.sendMessage(from, { delete: m.key });
            await Neko.sendMentionMessage(
              from,
              `*_This is a warning! @${sender.split("@")[0]} if you send nsfw again! You can get kicked from this group_*`,
              [sender],
            );
            return true;
          }
        }
        return false;
      };

      const NsfwDetector = async (file) => {
        try {
          const api = `https://www.nyckel.com/v1/functions/mcpf3t3w6o3ww7id/invoke`;
          const formData = new FormData();
          file.ext = file.ext.includes("mp4") ? "gif" : file.ext;
          file.mime = file.mime.includes("mp4") ? "image/gif" : file.mime;
          formData.append("file", file.data, {
            filename: `file.${file.ext}`,
            contentType: file.mime,
          });
          const res = await axios.post(api, formData, {
            headers: formData.getHeaders(),
          });
          return res.data;
        } catch {
          return null;
        }
      };

      const handleCommand = async (
        Neko,
        m,
        gc,
        isGroup,
        sequilizer,
        user_db,
      ) => {
        try {
          Neko.user_db = user_db;
          Neko.gc_db = gc_db;
          const M = await sequilizer(Neko, m);
          if (gc?.mode === "private" && !M?.isMod && isGroup) return false;

          if (gc?.mode === "admin" && (!M?.isAdmin || !M?.isMod) && isGroup)
            return false;

          if (M?.quoted.sender || M.mention[0]) {
            if (M?.mention) {
              M.mention.forEach(async (mention) => {
                await user_db.getUser(mention, M.pushName);
              });
            } else {
              await user_db.getUser(M.quoted.sender, M.pushName);
            }
          }

          if (M?.isGcBanned && M?.isGroup && !M.isMod) {
            await Neko.sendReactMessage(M.from, "❌", M);
            await Neko.sendTextMessage(
              M.from,
              "This group is banned from using this bot",
              M,
            );
            return true;
          }

          if (M?.isBanned) {
            await Neko.sendReactMessage(M.from, "❌", M);
            await Neko.sendTextMessage(
              M.from,
              "You are banned from using the bot",
              M,
            );
            return true;
          }

          await Neko.sendReactMessage(M.from, "♥️", M);
          if (Neko?.commands?.has(M?.cmdName)) {
            const cmd = Neko?.commands.get(M?.cmdName);
            if (!M?.isGroup && !M?.isMod && !M?.isPro) {
              await Neko.sendReactMessage(M.from, "❌", M);
              await Neko.sendTextMessage(
                M.from,
                "You Must Be a Mod or Pro To Use This Command In DM",
                M,
              );
              return true;
            }

            if (cmd?.isGroup && !M?.isGroup) {
              await Neko.sendReactMessage(M.from, "❌", M);
              await Neko.sendTextMessage(
                M.from,
                "You Must Use This Command In a Group",
                M,
              );
              return true;
            }

            if (cmd.isOwner && !M?.isOwner) {
              await Neko.sendReactMessage(M.from, "❌", M);
              await Neko.sendTextMessage(
                M.from,
                "You Must Be the Owner To use This Command",
                M,
              );
              return true;
            }

            if (cmd?.isAdmin && !M?.isAdmin && !M.isMod) {
              await Neko.sendReactMessage(M.from, "❌", M);
              await Neko.sendTextMessage(
                M.from,
                "You Must Be an Admin To use This Command",
                M,
              );
              return true;
            }

            if (cmd?.isBotAdmin && !M.isBotAdmin) {
              await Neko.sendReactMessage(M.from, "❌", M);
              await Neko.sendTextMessage(
                M.from,
                "The Bot Must Be an Admin To use This Command",
                M,
              );
              return true;
            }

            if (cmd?.isMod && !M?.isMod) {
              await Neko.sendReactMessage(M.from, "❌", M);
              await Neko.sendTextMessage(
                M.from,
                "You Must Be a Mod To use This Command",
                M,
              );
              return true;
            }

            return await cooldown(
              M.sender,
              cmd.cooldown * 1000 ?? 5000,
              cmd.run,
              Neko,
              M,
            );
          } else {
            if (M.from) {
              await Neko.sendReactMessage(M.from, "❌", M);
              await Neko.sendTextMessage(M.from, "Command not found!", M);
            }
            return true;
          }
        } catch (error) {
          throw new Error(error);
        }
      };

      const handleErrors = async (
        error,
        operation,
        currentAttempt,
        Neko,
        m,
        from,
      ) => {
        if (error.data?.status === 429) {
          const retryAfter =
            error.data?.headers?.["retry-after"] * 1000 || 30000;
          if (retryAfter) {
            await new Promise((resolve) => setTimeout(resolve, retryAfter));
          }
        }
        if (error.data?.status === 403) return;
        if (currentAttempt < 3 && operation.retry(error)) {
          Neko.log("error", `Attempt ${currentAttempt} failed. Retrying...`);
          if (currentAttempt === 2) {
            await Neko.sendReactMessage(from, "❌", m);
            console.log(error);
            Neko.log("error", `Maximum Retry Attempts Reached`);
            return;
          }
        }
      };

      await operation.attempt(async (currentAttempt) => {
        const [messageType, text, isCmd, from, isGroup, sender] = parseMessage(
          Neko,
          m,
          getContentType,
        );
        try {
          const gc = await gc_db.getGroup(from, m?.groupMeta?.subject);
          await user_db.getUser(sender, m.pushName);
          if (isGroup && text) {
            Neko.log("message", `${m.pushName || "Bot"} | ${text}`, "GROUP");
          } else if (!isGroup && text) {
            Neko.log("message", `${m.pushName || "Bot"} | ${text}`, "PRIVATE");
          }
          if (
            isGroup &&
            (await handleGroup(
              Neko,
              m,
              gc,
              isCmd,
              messageType,
              text,
              from,
              sequilizer,
              sender,
            ))
          )
            return;

          if (
            isCmd &&
            (await handleCommand(Neko, m, gc, isGroup, sequilizer, user_db))
          )
            return;
        } catch (error) {
          await handleErrors(error, operation, currentAttempt, Neko, m, from);
        }
      });
    };
    messageQueue.enqueue(
      processMessage.toString(),
      Neko,
      m,
      retry,
      sequilizer,
      cooldown,
      gc_db,
      user_db,
      getContentType,
      FormData,
      axios,
    );
  } catch (error) {
    console.error(error);
  }
};

export default messageHandler;
