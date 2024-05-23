import fs from "fs";
import retry from "retry";
import sequilizer from "../utils/sequelized.js";
import cooldown from "../utils/cooldown.js";
import DB from "../connect/db.js";
let META_DATA = JSON.parse(fs.readFileSync("src/config.json", "utf-8"));
let gc_db = new DB.GroupDbFunc();
let user_db = new DB.UserDbFunc();

class Queue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.filePath = "src/tmp/queueData.json"; // Path to the local file
  }

  async initialize() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = await fs.promises.readFile(this.filePath, "utf8");
        this.queue = JSON.parse(data);
      } else {
        await this.saveQueueToFile();
      }
    } catch (error) {
      console.error("Initialization error:", error);
      await fs.promises.writeFile(this.filePath, "[]");
      await this.initialize();
    }
  }

  async saveQueueToFile() {
    try {
      await fs.promises.writeFile(
        this.filePath,
        JSON.stringify(this.queue),
        "utf8",
      );
    } catch (error) {
      console.error("Error saving queue data to file:", error);
      throw new Error("Failed to save queue data to file.");
    }
  }

  async enqueue(funcString, ...args) {
    try {
      this.queue.push({ funcString, args }); // Save function string and its arguments
      await this.saveQueueToFile(); // Save queue data after enqueueing
      if (!this.processing) {
        await this.processQueue();
      }
    } catch (error) {
      console.log(error);
      throw new Error("Failed to enqueue item.");
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
          `return ${funcString}`,
        )(retry, sequilizer, cooldown, gc_db, user_db); // Convert string back to function with context
        await this.processItem(func, ...args);
        await this.saveQueueToFile(); // Save queue data after processing each item
      } catch (error) {
       await fs.promises.unlink(this.filePath);
        // Optionally, re-enqueue the item if you want to retry later
        this.queue.unshift({ funcString, args });
        await this.saveQueueToFile();
        throw Error(error); // Stop processing if there's an error to avoid infinite loops
      }
    }
    this.processing = false;
  }

  async processItem(func, ...args) {
    if (typeof func === "function") {
      await func(...args);
    } else {
      throw new Error("Item to process is not a function.");
    }
  }
}

const messageQueue = new Queue();
await messageQueue.initialize();

// Define the retry function
const messageHandler = async (Neko, m) => {
  Neko.prefix = META_DATA.prefix;
  const processMessage = async (
    Neko,
    m,
    retry,
    sequilizer,
    cooldown,
    gc_db,
    user_db,
  ) => {
    const operation = retry.operation({
      retries: 3, 
      factor: 3, 
      minTimeout: 1000, 
      maxTimeout: 4000, 
    });

    operation.attempt(async (currentAttempt) => {
      try {
        let text =
          m.message?.conversation ||
          m.message?.[m.messageType]?.text ||
          m.message?.[m.messageType]?.caption ||
          m.messageType ||
          m.message?.extendedTextMessage?.text ||
          "";
        let isCmd = text?.toString().startsWith(Neko.prefix);
        let from = m.key.remoteJid;
        let gc = await gc_db.getGroup(from);
        if (from?.endsWith("@g.us")) {
          if (gc.isBanned) {
            if (isCmd) {
              let M = await sequilizer(Neko, m);
              if (!M.isMod) {
                await Neko.sendTextMessage(
                  M.from,
                  `This Group *${M?.groupMeta?.subject}* have been banned from using this bot`,
                );
                return;
              }
            }
          }
          if (gc.isAntilink) {
            let wp_gc = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
            let gc_link = text?.match(wp_gc);
            if (gc_link) {
              let M = await sequilizer(Neko, m);
              if (!M?.isAdmin || !M?.isMod) {
                if (M?.isBotAdmin) {
                  await Neko.sendTextMessage(
                    M.from,
                    `This Group has Antilink enabled. Admin access needed for bot to work.`,
                  );
                  return;
                }
                await Neko.sendTextMessage(
                  M?.from,
                  "Antilink is active in this group",
                );
                await Neko.groupParticipantsUpdate(
                  M?.from,
                  [M.sender],
                  "remove",
                );
                await Neko.sendMessage(M?.from, { delete: M?.key });
                return;
              }
            }
          }
        }

        if (isCmd) {
          let M = await sequilizer(Neko, m);
          if(gc.mode === "private" && !M.isMod) return;
          if(gc.mode === "admin" && (!M.isAdmin ||!M.isMod)) return;
          
          Neko.user_db = user_db;
          if (M.quoted.sender || M.mention[0]) {
            await user_db.getUser(M.isQuoted ? M.quoted.sender : M.mention[0] || M.from);
          }
          let usr = await user_db.getUser(M?.sender, M?.pushName);
          Neko.gc_db = gc_db;
          if (usr.isBanned && !M.isMod) {
            await Neko.sendReactMessage(M?.from, "❌", M);
            await Neko.sendTextMessage(
              M?.from,
              "You are banned from using the bot",
              M,
            );
            return;
          }
          await Neko.sendReactMessage(M.from, "♥️", M);
          if (Neko?.commands?.has(M.cmdName)) {
            let cmd = Neko?.commands.get(M?.cmdName);
            if (M?.isBanned && M?.isGroup) {
              await Neko.sendTextMessage(
                M.from,
                "You are banned from using this bot",
                M,
              );
              return;
            }

            if (cmd?.isGroup && !M?.isGroup) {
              await Neko.sendTextMessage(
                M.from,
                "You Must Use This Command In a Group",
                M,
              );
              return;
            }

            if (M?.isGcBanned && M?.isGroup) {
              await Neko.sendTextMessage(
                M.from,
                "This group is banned from using this bot",
                M,
              );
              return;
            }

            if (cmd.isOwner && !M?.isOwner) {
              await Neko.sendTextMessage(
                M.from,
                "You Must Be the Owner To use This Command",
                M,
              );
              return;
            }

            if (cmd?.isAdmin && !M?.isAdmin && !M.isMod) {
              await Neko.sendTextMessage(
                M.from,
                "You Must Be an Admin To use This Command",
                M, 
              );
              return;
            }

            if (cmd?.isBotAdmin && !M?.isMod && !M.isBotAdmin) {
              await Neko.sendTextMessage(
                M.from,
                "The Bot Must Be an Admin To use This Command",
                M,
              );
              return;
            }

            if (cmd?.isMod && !M?.isMod) {
              await Neko.sendTextMessage(
                M.from,
                "You Must Be a Mod To use This Command",
                M,
              );
              return;
            }

            if (cmd?.isBotAdmin && !M?.isBotAdmin && !M?.isGroup) {
              await Neko.sendTextMessage(
                M.from,
                "The Bot Must Be a Group Admin To use This Command",
                M,
              );
              return;
            }

            if (!M?.isGroup && (!M?.isMod || !M?.isPro)) {
              await Neko.sendTextMessage(
                M.from,
                "You Must Be a Mod or Pro To Use This Command In DM",
                M,
              );
              return;
            }
            await cooldown(M?.sender, 5000, cmd.run, Neko, M);
          } else {
            if (M.from) {
              await Neko.sendReactMessage(M.from, "⚔️", M);
              await Neko.sendTextMessage(M.from, "Command not found!", M);
            }
            return;
          }
        }
          } catch (error) {
        if (error.data === 429) {
          let retryAfter = error.data?.headers?.["retry-after"] * 1000 || 30000;
          if (retryAfter) {
            return await new Promise((resolve) =>
              setTimeout(resolve, retryAfter)
            );
          }
        }
        if (error.data === 403) return;
        if (operation.retry(error)) {
          Neko.log("error", `Attempt ${currentAttempt} failed. Retrying...`);
          if (currentAttempt === 3) {
            await Neko.sendTextMessage(
              m.from,
              "*Failed to process the message...*",m)
            Neko.log("error", `Maximum Retry Attempts Reached`);
            return;
          }
        }
        Neko.log("error", `${error}`);
        console.log(error);
      }
    });
  };

  // Convert function to string and enqueue with necessary arguments
  messageQueue.enqueue(
    processMessage.toString(),
    Neko,
    m,
    retry,
    sequilizer,
    cooldown,
    gc_db,
    user_db,
  );
};

export default messageHandler;