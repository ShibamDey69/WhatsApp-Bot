import { getContentType } from "@whiskeysockets/baileys";

const fetchUserData = async (Neko, id, senderPn, filter, pushName) => {
  if (!id || !id.includes("@lid")) return null;
  const user = await Neko.userDB.getUser(id, senderPn, pushName);
  if (user) return user[filter];
  return null;
};


const fetchGroupData = async (Neko, id, filter, gcName) => {
  if (!id && id.includes("@g.us")) return null;
  const group = await Neko.groupDB.getGroup(id, gcName);
  if (group) return group[filter];
  return null;
};

const getMessageText = (message, messageType) => {
  return (
    message?.conversation ||
    message?.[messageType]?.text ||
    message?.[messageType]?.caption ||
    (message?.[messageType]?.selectedId
      ? process.env.PREFIX + message?.[messageType]?.selectedId
      : null) ||
    messageType?.replace("Message", "")
  );
};

const sequilizer = async (Neko, m) => {
  try {
    const messageType = getContentType(m.message);
    const isMe = m.key?.fromMe;
    const text = getMessageText(m.message, messageType);
    const from = m.key?.remoteJid;
    const fromAlt = m.key?.remoteJidAlt;
    const isGroup = from?.endsWith("@g.us");
    const botUserId = `${Neko.user.lid.split(":")[0]}@lid`
    const quotedMessageType = getContentType(
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    );
    const sender = isGroup ? m.key?.participant : isMe ? botUserId : fromAlt;
    const senderPn = isGroup
      ? isMe
        ? `${process.env.PHONE_NUMBER}@s.whatsapp.net`
        : m.key?.participantAlt
      : isMe
      ? fromAlt
      : from;
    
    if (
      !from ||
      (!from.includes("status@broadcast") &&
        !from.includes("@s.whatsapp.net") &&
        !from.includes("@g.us") &&
        !sender?.includes("@lid") &&
        !sender?.includes("@s.whatsapp.net"))
    )
      return null;
    let botPn = `${process.env.PHONE_NUMBER}@s.whatsapp.net`;
    let groupMeta = isGroup ? await Neko.groupMetadata(from) : null;
    let admins = isGroup
      ? groupMeta.participants.filter((v) => v.admin).map((v) => v.id)
      : [];

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
      mode,
    ] = await Promise.all([
      fetchUserData(Neko, sender, senderPn, "isMod", m.pushName),
      fetchUserData(Neko, sender, senderPn, "isPro", m.pushName),
      fetchUserData(Neko, sender, senderPn, "isBanned", m.pushName),
      fetchUserData(Neko, sender, senderPn, "isStatusView", m.pushName),
      fetchGroupData(Neko, from, "isBanned", groupMeta?.subject),
      fetchGroupData(Neko, from, "isAntilink", groupMeta?.subject),
      fetchGroupData(Neko, from, "isAntiNsfw", groupMeta?.subject),
      fetchGroupData(Neko, from, "isWelcome", groupMeta?.subject),
      fetchGroupData(Neko, from, "isReassign", groupMeta?.subject),
      fetchGroupData(Neko, from, "isChatAi", groupMeta?.subject),
      fetchGroupData(Neko, from, "mode", groupMeta?.subject),
    ]);

    const ownerNumber = [
      ...process.env.OWNER_NUMBER.split(",").map((v) => v.trim()),
      process.env.PHONE_NUMBER,
    ].map((v) => `${v}@s.whatsapp.net`);

    const mUpdated = {
      ...m,
      messageType,
      text,
      prefix: process.env.PREFIX,
      from,
      isGroup,
      sender:isGroup && isMe ? botUserId : sender,
      senderPn,
      groupMeta,
      groupOwner: groupMeta?.owner,
      admins,
      isAdmin: isGroup ? admins.includes(sender) : false,
      isOwner: isMe??ownerNumber.includes(senderPn),
      cmdName: text
        ?.slice(process.env.PREFIX.length)
        .trim()
        .split(" ")
        .shift()
        .toLowerCase(),
      args: text
        ?.slice(process.env.PREFIX.length + text.split(" ")[0].length)
        .trim(),
      isStatusView: isMe ? true : isStatusView,
      isWelcome,
      isAntilink,
      isGcBanned,
      isBanned:isMe ? false : isBanned,
      isChatAi,
      isAntiNsfw,
      isPro: isMe ? true : isPro,
      isReassign,
      isCmd: text?.startsWith(process.env.PREFIX),
      mode,
      isBotMsg: !m.pushName,
      botId: botUserId,
      isBotAdmin: isGroup ? admins.includes(botUserId) : false,
      isMod: isMe ? true : isMod,
      isStatus:
        !!m.message?.extendedTextMessage?.contextInfo?.remoteJid?.includes(
          "status@broadcast"
        ),
      mention: m.message?.[messageType]?.contextInfo?.mentionedJid || [],
      quoted: {
        mtype: quotedMessageType?.replace("Message", "")?? null,
        sender: m.message?.extendedTextMessage?.contextInfo?.participant ??null,
        text: m.message?.extendedTextMessage?.contextInfo?.quotedMessage
          ?.conversation ?? null,
        message: m.message?.extendedTextMessage?.contextInfo?.quotedMessage ?? null,
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
