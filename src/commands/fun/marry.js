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
      let user = M.isMentioned ? M.mention[0] : M.quoted.sender;
      let args = M.args;
      let action = args.includes("--accept")
        ? "accept"
        : args.includes("--reject")
          ? "reject"
          : args;
      if (!user)
        return Neko.sendTextMessage(
          M.from,
          "Please mention or quote a user to marry.",
          M,
        );

      let sender = await Neko.userDB.getUser(M.sender.split("@")[0]);
      let receiver = await Neko.userDB.getUser(user.split("@")[0]);

      if (action === "accept") {
        if (
          !sender?.proposal?.includes(receiver.userid) ||
          sender.isMarried ||
          receiver.isMarried
        ) {
          let ErrorMess = getErrorMessage(sender, receiver);
          return Neko.sendMentionMessage(
            M.from,
            ErrorMess.text,
            ErrorMess.mention,
            M,
          );
        }
        await Neko.userDB.setMarried(M.sender, user, true);
        await Neko.userDB.setMarried(user, M.sender, true);
        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* and *@${user.split("@")[0]}* are now married!`,
          [M.sender, user],
          M,
        );
      } else if (action === "reject") {
        if (!sender.proposal?.includes(receiver.userid))
          return Neko.sendTextMessage(
            M.from,
            "No marriage request found from this user.",
            M,
          );

        await Neko.userDB.rejectProposal(M.sender, user);
        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* has rejected the marriage proposal from *@${user.split("@")[0]}*`,
          [M.sender, user],
          M,
        );
      } else {
        if (
          sender.partner === receiver.userid ||
          sender.userid === receiver.userid ||
          sender.isMarried ||
          receiver.isMarried ||
          sender.proposal?.includes(receiver.userid)
        ) {
          let ErrorMess = getErrorMessage(sender, receiver);
          return Neko.sendMentionMessage(
            M.from,
            ErrorMess.text,
            [...ErrorMess.mention],
            M,
          );
        }

        await Neko.userDB.addProposal(user, M.sender);
        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* has sent a marriage request to *@${user.split("@")[0]}*`,
          [M.sender, user],
          M,
        );
      }
    } catch (error) {
      await Neko.error(error);
    }
  },
};

const getErrorMessage = (sender, receiver) => {
  if (sender.partner === receiver.userid)
    return {
      text: `*@${sender.userid.split("@")[0]}* is already married to *@${receiver.userid.split("@")[0]}*`,
      mention: [sender.userid, receiver.userid],
    };
  else if (sender.userid === receiver.userid)
    return {
      text: `*@${sender.userid.split("@")[0]}* can't marry himself...`,
      mention: [sender.userid],
    };
  else if (sender.isMarried)
    return {
      text: `You are already married to *@${sender.partner.split("@")[0]}*... don't be a cheater 😕 baka..!`,
      mention: [sender.partner],
    };
  else if (receiver.isMarried)
    return {
      text: `Sorry You are quite late😔 *@${receiver.userid.split("@")[0]}* has already fallen for *@${receiver.partner.split("@")[0]}* ♥️🌚`,
      mention: [receiver.userid, receiver.partner],
    };
  else if (sender?.proposal?.includes(receiver.userid))
    return {
      text: `*@${sender.userid.split("@")[0]}* has already sent a marriage proposal to *@${receiver.userid.split("@")[0]}*`,
      mention: [sender.userid, receiver.userid],
    };
  else
    return {
      text: "No marriage request found from this user.",
      mention: [sender.userid],
    };
};
