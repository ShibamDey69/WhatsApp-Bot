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

const messageHandler = async (Neko, m) => {
  try {
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
        (m.message?.[messageType]?.selectedId
          ? Neko.prefix + m.message?.[messageType]?.selectedId
          : null) ||
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
        const gc_link = text.match(/chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i);
        if (gc_link) {
          const M = await sequilizer(Neko, m);
          if (!M?.isAdmin && !M?.isMod) {
            if (!M?.isBotAdmin) {
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

    const handleCommand = async (Neko, m, gc, isGroup, sequilizer, user_db) => {
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

        if (Neko?.commands?.has(M?.cmdName)) {
          const cmd = Neko?.commands.get(M?.cmdName);
          await Neko.sendReactMessage(M.from, "♥️", M);
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

    const handleErrors = async (error, operation, Neko, from, M) => {
      if (!operation.retry(error)) {
        await Neko.sendReactMessage(from, "❌", M);
        await Neko.sendTextMessage(
          from,
          `An error occurred while processing your request. Please try again later. ${error}`,
          M,
        );
        return true;
      }
    };

    operation.attempt(async () => {
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
        await handleErrors(error, operation, Neko, from, m);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

export default messageHandler;
