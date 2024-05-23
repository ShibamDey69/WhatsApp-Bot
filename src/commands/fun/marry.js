export default {
  name: "marry",
  aliases: ["marry"],
  description: "Send or respond to a marriage request",
  category: "fun",
  usage: "marry @tag | marry --accept @tag | marry --reject @tag",
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
          "Please mention or quote a user to marry.",
          M,
        );
      }

      let sender = await Neko.user_db.getUser(M.sender.split("@")[0]);
      let receiver = await Neko.user_db.getUser(user.split("@")[0]);

      // Handling marriage requests
      if (action === "accept") {
        if (!receiver.proposal.includes(M.sender)) {
          return Neko.sendTextMessage(
            M.from,
            "No marriage request found from this user.",
            M
          );
        }

        if (sender.isMarried) {
          return Neko.sendMentionMessage(
            M.from,
            `You are already married to *@${sender.partner.split("@")[0]}*... don't be a cheater 😕 baka..!`,
            [sender.partner],
            M,
          );
        }
        if (receiver.isMarried) {
          return Neko.sendMentionMessage(
            M.from,
            `*@${receiver.user_id.split("@")[0]}* has already fallen for *@${receiver.partner.split("@")[0]}* ♥️🌚`,
            [receiver.user_id, receiver.partner],
            M,
          );
        }

        await Neko.user_db.setMarried(M.sender, user, true);
        await Neko.user_db.setMarried(user, M.sender, true);

        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* and *@${user.split("@")[0]}* are now married!`,
          [M.sender, user],
          M,
        );
      } else if (action === "reject") {
        if (!receiver.proposal.includes(M.sender)) {
          return Neko.sendTextMessage(
            M.from,
            "No marriage request found from this user.",
            M
          );
        }

        await Neko.user_db.rejectProposal(user, M.sender);

        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* has rejected the marriage proposal from *@${user.split("@")[0]}*`,
          [M.sender, user],
          M,
        );
      } else {
        if (sender.isMarried) {
          console.log(sender);
          return Neko.sendMentionMessage(
            M.from,
            `You are already married to *@${sender.partner.split("@")[0]}*... don't be a cheater 😕 baka..!`,
            [sender.partner],
            M,
          );
        }
        if (receiver.isMarried) {
          return Neko.sendMentionMessage(
            M.from,
            `*@${receiver.user_id.split("@")[0]}* has already fallen for *@${receiver.partner.split("@")[0]}* ♥️🌚`,
            [receiver.user_id, receiver.partner],
            M,
          );
        }

        await Neko.user_db.addProposal(user, M.sender);

        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* has sent a marriage request to *@${user.split("@")[0]}*`,
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
