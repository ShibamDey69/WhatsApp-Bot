import retry from "retry";
import sequilizer from "../utils/sequelized.js";
import NsfwDetector from "../utils/nsfwDetector.js";
import cooldown from "../utils/cooldown.js";
import CharacterAi from "../utils/characterAi.js";

const messageHandler = async (Neko, m) => {
  try {
    const operation = retry.operation({
      retries: 2,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 4000,
    });

    const M = await sequilizer(Neko, m);
    if (!M) return;

    const handleGroup = async ({ Neko, M }) => {
      if (M.isGcBanned && M.isCmd) {
        if (!M.isMod) {
          await Neko.sendTextMessage(
            M.from,
            `This Group *${M.groupMeta?.subject}* have been banned from using this bot`
          );
          return true;
        }
      }

      if (M.isAntilink) {
        const gc_link = M.text?.match(
          /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
        );
        if (gc_link) {
          if (!M.isAdmin && !M.isMod) {
            if (!M.isBotAdmin) {
              await Neko.sendTextMessage(
                M.from,
                "This Group has Antilink enabled. Admin access needed for bot to work."
              );
              return true;
            }
            await Neko.sendTextMessage(
              M.from,
              "Antilink is active in this group"
            );
            await Neko.sendMessage(M.from, { delete: M.key });
            await Neko.groupParticipantsUpdate(M.from, [M.sender], "remove");
            return true;
          }
        }
      }

      if (M.isChatAi) {
        if (
          M.isQuoted &&
          M.quoted?.sender.split("@")[0] === process.argv[2] &&
          !M.isBotMsg
        ) {
          const chatAi = new CharacterAi({
            token: "84b1ad14a3715765412a55f9cccfe81fb714f397",
            chat_id: M.sender,
            char_id: "UQiZztjKGVrf6GQFDP2Qq5cBE1GualYgOUtSqRML4ic",
            author_id: "524116483",
          });
          await chatAi.send(M.quoted.text);
          chatAi.on("final.data", async (data) => {
            return await Neko.sendTextMessage(M.from, data, M);
          });
          return true;
        }
      }
      if (
        M.isAntiNsfw &&
        (M.messageType === "imageMessage" || M.messageType === "stickerMessage")
      ) {
        const data = await Neko.downloadMediaContent(Neko, M);
        const res = await NsfwDetector(data);
        if (
          res?.labelName.includes("NSFW") ||
          res?.labelName === "SFW Mildly Suggestive"
        ) {
          await Neko.sendMessage(M.from, { delete: M.key });
          await Neko.sendMentionMessage(
            M.from,
            `*_This is a warning! @${
              M.sender.split("@")[0]
            } if you send nsfw again! You can get kicked from this group_*`,
            [M.sender]
          );
          return true;
        }
      }
      return false;
    };

    const handleCommand = async ({ Neko, M }) => {
      try {
        if (M.mode === "private" && !M.isMod && M.isGroup) return false;
        
        if (M.mode === "admin" && (!M.isAdmin || !M.isMod) && M.isGroup)
          return false;
        if (M.quoted.sender || M.mention[0]) {
          if (M.mention) {
            M.mention.forEach(async (mention) => {
              await Neko.userDB.getUser(mention, M.pushName);
            });
          } else {
            await Neko.userDB.getUser(M.quoted.sender, M.pushName);
          }
        }

        if (M.isGcBanned && M.isGroup && !M.isMod) {
          await Neko.sendReactMessage(M.from, "❌", M);
          await Neko.sendTextMessage(
            M.from,
            "This group is banned from using this bot",
            M
          );
          return true;
        }

        if (M.isBanned) {
          await Neko.sendReactMessage(M.from, "❌", M);
          await Neko.sendTextMessage(
            M.from,
            "You are banned from using the bot",
            M
          );
          return true;
        }

        if (Neko?.commands?.has(M.cmdName)) {
          const cmd = Neko?.commands.get(M.cmdName);
          await Neko.sendReactMessage(M.from, "♥️", M);
          if (!M.isGroup && !M.isMod && !M.isPro) {
            await Neko.sendReactMessage(M.from, "❌", M);
            await Neko.sendTextMessage(
              M.from,
              "You Must Be a Mod or Pro To Use This Command In DM",
              M
            );
            return true;
          }

          if (cmd?.isGroup && !M.isGroup) {
            await Neko.sendReactMessage(M.from, "❌", M);
            await Neko.sendTextMessage(
              M.from,
              "You Must Use This Command In a Group",
              M
            );
            return true;
          }

          if (cmd.isOwner && !M.isOwner) {
            await Neko.sendReactMessage(M.from, "❌", M);
            await Neko.sendTextMessage(
              M.from,
              "You Must Be the Owner To use This Command",
              M
            );
            return true;
          }

          if (cmd?.isAdmin && !M.isAdmin && !M.isMod) {
            await Neko.sendReactMessage(M.from, "❌", M);
            await Neko.sendTextMessage(
              M.from,
              "You Must Be an Admin To use This Command",
              M
            );
            return true;
          }

          if (cmd?.isBotAdmin && !M.isBotAdmin) {
            await Neko.sendReactMessage(M.from, "❌", M);
            await Neko.sendTextMessage(
              M.from,
              "The Bot Must Be an Admin To use This Command",
              M
            );
            return true;
          }

          if (cmd?.isMod && !M.isMod) {
            await Neko.sendReactMessage(M.from, "❌", M);
            await Neko.sendTextMessage(
              M.from,
              "You Must Be a Mod To use This Command",
              M
            );
            return true;
          }

          return await cooldown(
            M.sender,
            cmd.cooldown * 1000 ?? 5000,
            cmd.run,
            Neko,
            M
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

    const handleErrors = async ({ error, operation, Neko, M }) => {
      if (!operation.retry(error)) {
        if (M.from) {
          await Neko.sendReactMessage(M.from, "❌", M);
          await Neko.sendTextMessage(
            M.from,
            `An error occurred while processing your request. Please try again later. ${error}`,
            M
          );
          return true;
        }
        return false;
      }
    };

    operation.attempt(async () => {
      try {
        if (
          !M.sender ||
          (!M.sender.includes("@s.whatsapp.net") &&
            !M.sender.includes("@lid")) ||
          !M.pushName
        )
          return;
        if (M.isGroup && M.text) {
          Neko.log("message", `${M.pushName || "Bot"} | ${M.text}`, "GROUP");
        } else if (!M.isGroup && M.text) {
          Neko.log("message", `${M.pushName || "Bot"} | ${M.text}`, "PRIVATE");
        }
        if (
          M.isGroup &&
          (await handleGroup({
            Neko,
            M,
          }))
        )
          return;
        if (M.isCmd && (await handleCommand({ Neko, M }))) return;
      } catch (error) {
        await handleErrors({ error, operation, Neko, M });
      }
    });
  } catch (error) {
    console.error(error);
  }
};

export default messageHandler;
