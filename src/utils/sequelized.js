import { getContentType } from "@whiskeysockets/baileys";

const fetchUserData = async (Neko, id, filter, pushName) => {
  if (!id) return null;
  const user = await Neko.userDB.getUser(id, pushName);
  if (user) return user[filter];
  return null;
};

const fetchGroupData = async (Neko, id, filter, gcName) => {
  if (!id) return null;
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
    if (
      !m.key?.remoteJid ||
      m.key?.remoteJid.includes("status@broadcast") ||
      (!m.key?.remoteJid.includes("@s.whatsapp.net") &&
        !m.key?.remoteJid.includes("@g.us"))
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
      fetchUserData(Neko, sender, "isMod", m.pushName),
      fetchUserData(Neko, sender, "isPro", m.pushName),
      fetchUserData(Neko, sender, "isBanned", m.pushName),
      fetchUserData(Neko, sender, "isStatusView", m.pushName),
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
