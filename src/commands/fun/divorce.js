export default {
  name: "divorce",
  aliases: ["divorce"],
  description: "Initiate divorce proceedings or respond to a divorce request",
  category: "fun",
  usage: "divorce @tag | divorce --accept @tag | divorce --reject @tag",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      let user = M.isQuoted ? M.quoted.sender : M.mention[0];
      let args = M.args;
      let action = args.includes("--accept")
        ? "accept"
        : args.includes("--reject")
          ? "reject"
          : args;

      if (!user) {
        return Neko.sendTextMessage(
          M.from,
          "Please mention or quote a user to divorce.",
          M,
        );
      }

      let sender = await Neko.user_db.getUser(M.sender.split("@")[0]);
      let receiver = await Neko.user_db.getUser(user.split("@")[0]);

      if (action === "accept") {
        if (!receiver.proposal.includes(M.sender)) {
          return Neko.sendTextMessage(
            M.from,
            "No divorce request found from this user.",
            M
          );
        }

        if (receiver.partner !== M.sender) {
          return Neko.sendMentionMessage(
            M.from,
            `You are not married to *@${receiver.user_id.split("@")[0]}* to accept the divorce request.`,
            [receiver.user_id],
            M,
          );
        }

        await Neko.user_db.setMarried(M.sender, null, false);
        await Neko.user_db.setMarried(user, null, false);

        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* and *@${user.split("@")[0]}* are now divorced.`,
          [M.sender, user],
          M,
        );
      } else if (action === "reject") {
        if (!receiver.proposal.includes(M.sender)) {
          return Neko.sendTextMessage(
            M.from,
            "No divorce request found from this user.",
            M
          );
        }

        await Neko.user_db.rejectProposal(user, M.sender);

        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* has rejected the divorce request from *@${user.split("@")[0]}*`,
          [M.sender, user],
          M,
        );
      } else {
        if (!receiver.isMarried || !sender.isMarried) {
          return Neko.sendTextMessage(
            M.from,
            "You are not currently married to initiate a divorce.",
            M
          );
        }

        if (receiver.partner !== M.sender) {
          return Neko.sendMentionMessage(
            M.from,
            `You are not married to *@${receiver.user_id.split("@")[0]}* to divorce.`,
            [receiver.user_id],
            M,
          );
        }

        await Neko.user_db.addProposal(user, M.sender);

        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* has sent a divorce request to *@${user.split("@")[0]}*`,
          [M.sender, user],
          M,
        );
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  },
};
