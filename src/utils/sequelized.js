import { getContentType } from "@whiskeysockets/baileys";
import fs from "fs";
import DB from "../connect/db.js";

const META_DATA = JSON.parse(fs.readFileSync("src/config.json", "utf-8"));
const user_db = new DB.UserDbFunc();
const group_db = new DB.GroupDbFunc();

const fetchUserData = async (id, filter,pushName) => {
  if (!id) return null;
  const user = await user_db.getUser(id,pushName);
  if (user) return user[filter];
  return null;
};

const fetchGroupData = async (id, filter,gcName) => {
  if (!id) return null;
  const group = await group_db.getGroup(id,gcName);
  if (group) return group[filter];
  return null;
};

const getMessageText = (message, messageType) => {
  return (
    message?.conversation ||
    message?.[messageType]?.text ||
    message?.[messageType]?.caption ||
    (message?.[messageType]?.selectedId
      ? Neko.prefix + message?.[messageType]?.selectedId
      : null) ||
    messageType ||
    ""
  );
};

const sequilizer = async (Neko, m) => {
  try {
    if (m.key?.remoteJid === "status@broadcast") return
    if (
      !m.key?.remoteJid.includes("@s.whatsapp.net") &&
      !m.key?.remoteJid.includes("@g.us")
    )
      return;
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

    
    let groupMeta, admins
    if (isGroup) {
      groupMeta = await Neko.groupMetadata(from);
      admins = groupMeta.participants.filter((v) => v.admin).map((v) => v.id);
    } else {
      groupMeta = null;
      admins = [];
    }
    const [
      isMod,
      isPro,
      isBanned,
      isStatusView,
      isGcBanned,
      isAntilink,
      isAntiNsfw,
      isWelcome,
      isReassign,
      isChatAi,
      mode
    ] = await Promise.all([
      fetchUserData(sender, "isMod",m.pushName),
      fetchUserData(sender, "isPro",m.pushName),
      fetchUserData(sender, "isBanned",m.pushName),
      fetchUserData(sender, "isStatusView",m.pushName),
      fetchGroupData(from, "isBanned",groupMeta?.subject),
      fetchGroupData(from, "isAntilink",groupMeta?.subject),
      fetchGroupData(from, "isAntiNsfw", groupMeta?.subject),
      fetchGroupData(from, "isWelcome", groupMeta?.subject),
      fetchGroupData(from, "isReassign", groupMeta?.subject),
      fetchGroupData(from, "isChatAi", groupMeta?.subject),
      fetchGroupData(from, "mode", groupMeta?.subject),
    ]);

    const ownerNumber = [...META_DATA.ownerNumber.map((v) => `${v}@s.whatsapp.net`), process.env.PHONE_NUMBER];

    const mUpdated = {
      ...m,
      messageType,
      text,
      prefix: process.env.PREFIX,
      from,
      isGroup,
      sender,
      groupMeta,
      groupOwner: groupMeta?.owner,
      admins,
      isAdmin: isGroup ? admins.includes(sender) : false,
      isOwner: ownerNumber.includes(sender),
      cmdName: text
        ?.slice(process.env.PREFIX.length)
        .trim()
        .split(" ")
        .shift()
        .toLowerCase(),
      args: text
        ?.slice(process.env.PREFIX.length + text.split(" ")[0].length)
        .trim(),
      isStatusView,
      isWelcome,
      isAntilink,
      isGcBanned,
      isBanned,
      isChatAi,
      isAntiNsfw,
      isPro,
      isReassign,
      isCmd: text?.startsWith(process.env.PREFIX),
      mode,
      isBotMsg: !m.pushName,
      isBotAdmin: isGroup
        ? admins.includes(`${Neko.user.id.split(":")[0]}@s.whatsapp.net`)
        : false,
      isMod,
      isStatus:
        m.message?.extendedTextMessage?.contextInfo?.remoteJid?.includes(
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
        m.message?.[messageType]?.contextInfo?.mentionedJid?.length > 0,
      isQuoted: !!m.message?.extendedTextMessage?.contextInfo?.quotedMessage,
    };
    return mUpdated;
  } catch (error) {
    console.error(error);
    Neko.log("error", error);
    return m; // Returning the original message object in case of error
  }
};

export default sequilizer;
