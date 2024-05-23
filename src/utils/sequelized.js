import { getContentType } from "@whiskeysockets/baileys";
import fs from "fs";
import DB from "../connect/db.js";
let META_DATA = JSON.parse(fs.readFileSync("src/config.json", "utf-8"));
let user_db = new DB.UserDbFunc();
let group_db = new DB.GroupDbFunc();
let modUser = await user_db.filterUser("isMod", true);
let mods = modUser.map((user) => user.user_id);
let proUser = await user_db.filterUser("isPro", true);
let pros = proUser.map((user) => user.user_id);
let banUser = await user_db.filterUser("isBanned", true);
let bans = banUser.map((user) => user.user_id);
let gcBan = await group_db.filterGroup("isBanned", true);
let GcBan = gcBan.map((user) => user.group_id);
let antilink = await group_db.filterGroup("isAntilink", true);
let Antilink = antilink.map((group) => group.group_id);
let welcome = await group_db.filterGroup("isWelcome", true);
let Welcome = welcome.map((group) => group.group_id);


const sequilizer = async (Neko, m) => {
   try {
      m.messageType = getContentType(m.message);
      m.text =
         m.message?.conversation ||
         m.message?.[m.messageType]?.text ||
         m.message?.[m.messageType]?.caption ||
         m.messageType || m.message?.extendedTextMessage?.contextInfo?.quotedMessage || "";
      m.prefix = META_DATA.prefix;
      m.from = m.key?.remoteJid;
      m.isGroup = m.from?.endsWith("@g.us");
      m.isMe = m.key?.fromMe;
      m.owner = META_DATA.ownerNumber;
      m.sender = m?.isMe
         ? `${Neko?.user?.id?.split(":")[0]}@s.whatsapp.net`
         : m.isGroup
           ? m.key?.participant
           : m.from;
      m.groupMeta = m.isGroup ? await Neko?.groupMetadata(m.from) : "";
      m.groupOwner = m.groupMeta?.owner;
      m.participants = m.isGroup ? m.groupMeta?.participants : [];
      m.admins = m.isGroup
         ? m.groupMeta.participants
              .filter((v) => v.admin === "admin" || v.admin === "superadmin")
              .map((v) => v.id)
         : [];
      m.isAdmin = m.isGroup ? m.admins.includes(m.sender) : false;
      m.isOwner = m.owner?.includes(m.sender?.split("@")[0]);
      m.cmdName = m.text
         ?.toString()
         .slice(m.prefix.length)
         .trim()
         .split(" ")
         .shift()
         .toLowerCase();
      m.args = m.text?.slice(2 + m.cmdName.length).trim();
      m.mods = [...m.owner.map((v) => `${v}@s.whatsapp.net`), ...mods];
      m.pro = [...m.mods, ...pros];
      m.ban = bans;
      m.gcBan = GcBan;
      m.antilink = Antilink;
      m.welcome = Welcome;
      m.isWelcome = m.welcome.includes(m.from);
      m.isAntilink = m.antilink.includes(m.from);
      m.isGcBanned = m.gcBan.includes(m.from);
      m.isBanned = m.ban.includes(m.sender);
      m.isPro = m.pro.includes(m.sender);
      m.isCmd = m.text?.toString().startsWith(m.prefix);
      m.isBotMsg =
         (m.key?.id.startsWith("BAE5") && m.key?.id?.length === 16) ||
         (m.key?.id.startsWith("3EB0") && m.key?.id?.length === 12);
      m.isBotAdmin = m.isGroup
         ? m.admins?.includes(`${Neko.user.id.split(":")[0]}@s.whatsapp.net`)
         : false;
      m.isMod = m.mods?.includes(m.sender);
      m.mention = m.message?.[m.messageType]?.contextInfo?.mentionedJid || [];
      m.quoted = {
         message: m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
         sender: m.message?.extendedTextMessage?.contextInfo?.participant,
         text: m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      };
      m.isMentioned = m.mention.length !== 0;
      m.isQuoted = m.quoted?.message ? true : false;
      return m;
   } catch (error) {
      console.log(error);
      Neko.log("error", error);
   }
};

export default sequilizer;
