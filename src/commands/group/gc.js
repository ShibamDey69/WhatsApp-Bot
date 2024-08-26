import fs from "fs";
import os from "os";

export default {
  name: "gc",
  aliases: ["gc"],
  category: "group",
  description: "Manage group chats",
  usage:
    "gc --leave | gc --info | gc --setpp | gc --setname | gc --setdesc | gc --open | gc --close | gc --setdesc <description> | gc --setname <name> | gc --change-settings <setting> | gc --invite-code | gc --revoke-invite-code | gc --join-group <inviteCode> | gc --removepp <jid>",
  cooldown: 5,
  isAdmin: true,
  isBotAdmin: true,
  isGroup: true,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      let args = M.args.split(" ");
      if (!M.args) {
        return Neko.sendTextMessage(M.from, "Please provide the option.", M);
      }
      if (M.args.toLowerCase().includes("list")) {
        const menuOptions = [
          "*--leave*: Leave the group",
          "*--info*: Get information about the group",
          "*--setpp*: Set profile picture for the group",
          "*--setname*: Change the name of the group",
          "*--setdesc*: Change the description of the group",
          "*--open-settings*: Open group settings for everyone",
          "*--close-settings*: Close group settings for everyone",
          "*--invite-code*: Get the invite code for the group",
          "*--revoke-invite-code*: Revoke the invite code for the group",
          "*--join-group <inviteCode>*: Join a group using the invite code",
          "*--removepp <jid>*: Remove profile picture of the group",
        ];

        const menuMessage =
          "Here are the available options:\n\n" + menuOptions.join("\n\n");
        Neko.sendTextMessage(M.from, menuMessage, M);
        return;
      }

      switch (args[0].toLowerCase()) {
        case "--leave":
          await Neko.sendMentionMessage(M.from, "*Bye Bye Guys!*",M.groupMeta.participants.map(v=>v.id), M);
          await Neko.groupLeave(M.from);
          break;
        case "--info":
          const metadata = await Neko.groupMetadata(M.from);
          const infoMessage = `*Title:* ${metadata.subject}\n*Admins:* ${M.admins}\n*Description:* ${metadata.desc}`;
          Neko.sendTextMessage(M.from, infoMessage, M);
          break;
        case "--setpp":
          const quotedMessage = M.quoted;
          if (!quotedMessage || !quotedMessage.message) {
            Neko.sendTextMessage(
              M.from,
              "*Please quote or caption an image to set as profile picture.*",
              M,
            );
            return;
          }

          const tmpDir = os.tmpdir();
          const filename = `profile_picture_${Date.now()}.jpg`;
          const filePath = `${tmpDir}/${filename}`;

          let image = await Neko.downloadMediaContent(Neko, quotedMessage);

          fs.writeFileSync(filePath, image.data);

          await Neko.updateProfilePicture(M.from, { url: filePath });
          fs.unlinkSync(filePath);

          Neko.sendTextMessage(
            M.from,
            "*Profile picture updated successfully!*",
            M,
          );
          break;
        case "--setname":
          const newName = args.slice(1).join(" ");
          await Neko.groupUpdateSubject(M.from, newName);
          Neko.sendTextMessage(
            M.from,
            `*Group name changed to* ${newName} *successfully!*`,
            M,
          );
          break;
        case "--setdesc":
          const newDesc = args.slice(1).join(" ");
          await Neko.groupUpdateDescription(M.from, newDesc);
          Neko.sendTextMessage(
            M.from,
            `*Group description changed to* ${newDesc} *successfully!*`,
            M,
          );
          break;
        case "--open-settings":
        case "--open-setting":
          await Neko.groupSettingUpdate(M.from, "unlocked");
          Neko.sendTextMessage(
            M.from,
            "*Group is now open for everyone to modify settings.*",
            M,
          );
          break;
        case "--close-settings":
        case "--close-setting":
          await Neko.groupSettingUpdate(M.from, "locked");
          Neko.sendTextMessage(M.from, "*Group settings are now locked.*", M);
          break;
        case "--settings":
        case "--gc-settings":
          const setting = args[1];
          await handleGroupSettings(setting, Neko, M);
          break;
        case "--invite-code":
          const code = await Neko.groupInviteCode(M.from);
          Neko.sendTextMessage(M.from, `*Group code:* ${code}`, M);
          break;
        case "--revoke-invite-code":
          const newCode = await Neko.groupRevokeInvite(M.from);
          Neko.sendTextMessage(M.from, `*New group code:* ${newCode}`, M);
          break;
        case "--join-group":
          const inviteCode = args[1];
          const response = await Neko.groupAcceptInvite(inviteCode);
          Neko.sendTextMessage(
            M.from,
            `*Joined group successfully:* ${response}`,
            M,
          );
          break;
        case "--removepp":
          const jidToRemoveDp = args[1];
          await Neko.removeProfilePicture(jidToRemoveDp);
          Neko.sendTextMessage(
            M.from,
            "*Display picture removed successfully!*",
            M,
          );
          break;
        default:
          Neko.sendTextMessage(M.from, "*Unknown command*", M);
          break;
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};

async function handleGroupSettings(setting, Neko, M) {
  switch (setting) {
    case "open":
    case "opened":
      if (M.groupMeta.announce == true) {
        return Neko.sendTextMessage(M.from, "*Group is already open!*", M);
      }
      await Neko.groupSettingUpdate(M.from, "announcement", M);
      await Neko.sendTextMessage(
        M.from,
        "*Group is now open for everyone.*",
        M,
      );
      break;
    case "close":
    case "closed":
      if (M.groupMeta.announce == false) {
        return Neko.sendTextMessage(M.from, "*Group is already closed!*", M);
      }
      await Neko.groupSettingUpdate(M.from, "not_announcement", M);
      await Neko.sendTextMessage(M.from, "*Group is now closed.*", M);
      break;
    default:
      Neko.sendTextMessage(M.from, "*Unknown setting*", M);
      break;
  }
}
