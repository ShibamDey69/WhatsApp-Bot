import { getContentType } from "@whiskeysockets/baileys";
import fs from "fs";
import DB from "../connect/db.js";

const META_DATA = JSON.parse(fs.readFileSync("src/config.json", "utf-8"));
const user_db = new DB.UserDbFunc();
const group_db = new DB.GroupDbFunc();

const fetchUserData = async (filter) => {
  const users = await user_db.filterUser(filter, true);
  return users.map((user) => user?.user_id);
};

const fetchGroupData = async (filter) => {
  const groups = await group_db.filterGroup(filter, true);
  return groups.map((group) => group?.group_id);
};

const getMessageText = (message, messageType) => {
  return (
    message?.conversation ||
    message?.[messageType]?.text ||
    message?.[messageType]?.caption ||
    message?.[messageType]?.contextInfo?.quotedMessage?.conversation ||
    messageType ||
    ""
  );
};

const sequilizer = async (Neko, m) => {
  try {
    if (m.key?.remoteJid === "status@broadcast") return;
    const [mods, pros, bans, GcBan, Antilink, Welcome, Reassign] =
      await Promise.all([
        fetchUserData("isMod"),
        fetchUserData("isPro"),
        fetchUserData("isBanned"),
        fetchGroupData("isBanned"),
        fetchGroupData("isAntilink"),
        fetchGroupData("isWelcome"),
        fetchGroupData("isReassign"),
      ]);

    const messageType = getContentType(m.message);
    const text = getMessageText(m.message, messageType);
    const from = m.key?.remoteJid;
    const isGroup = from?.endsWith("@g.us");
    const quotedMessageType = getContentType(
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    );
    const isMe = m.key?.fromMe;
    const sender = isMe
      ? `${Neko?.user?.id?.split(":")[0]}@s.whatsapp.net`
      : isGroup
        ? m.key?.participant
        : from;
    let groupMeta, admins;
    if (isGroup) {
      groupMeta = await Neko.groupMetadata(from);
      admins = groupMeta.participants.filter((v) => v.admin).map((v) => v.id);
    } else {
      groupMeta = null;
      admins = [];
    }
    const ownerNumber = META_DATA.ownerNumber.map((v) => `${v}@s.whatsapp.net`);
    const modsList = [...ownerNumber, ...mods];
    const mUpdated = {
      ...m,
      messageType,
      text,
      prefix: META_DATA.prefix,
      from,
      isGroup,
      sender,
      groupMeta,
      groupOwner: groupMeta?.owner,
      admins,
      isAdmin: isGroup ? admins.includes(sender) : false,
      isOwner: ownerNumber.includes(sender),
      cmdName: text
        ?.slice(META_DATA.prefix.length)
        .trim()
        .split(" ")
        .shift()
        .toLowerCase(),
      args: text
        ?.slice(META_DATA.prefix.length + text.split(" ")[0].length)
        .trim(),
      mods: modsList,
      pro: [...modsList, ...pros],
      reassign: Reassign,
      ban: bans,
      gcBan: GcBan,
      antilink: Antilink,
      welcome: Welcome,
      isWelcome: Welcome.includes(from),
      isAntilink: Antilink.includes(from),
      isGcBanned: GcBan.includes(from),
      isBanned: bans.includes(sender),
      isPro: [...modsList, ...pros].includes(sender),
      isReassign: Reassign.includes(from),
      isCmd: text?.startsWith(META_DATA.prefix),
      isBotMsg: m.pushName ?? false,
      isBotAdmin: isGroup
        ? admins.includes(`${Neko.user.id.split(":")[0]}@s.whatsapp.net`)
        : false,
      isMod: modsList.includes(sender),
      isStatus:
        m.message?.extendedTextMessage?.contextInfo?.remoteJid?.endsWith(
          "status@broadcast",
        ),
      mention: m.message?.[messageType]?.contextInfo?.mentionedJid || [],
      quoted: {
        mtype: quotedMessageType?.replace("Message", ""),
        sender: m.message?.extendedTextMessage?.contextInfo?.participant,
        text: m.message?.extendedTextMessage?.contextInfo?.quotedMessage
          ?.conversation,
        message: m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
      },
      isMentioned:
        m.message?.[messageType]?.contextInfo?.mentionedJid?.length !== 0,
      isQuoted: m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    };
    return mUpdated;
  } catch (error) {
    console.error(error);
    Neko.log("error", error);
    return m; // Returning the original message object in case of error
  }
};

export default sequilizer;
