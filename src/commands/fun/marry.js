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

      let sender = await Neko.user_db.getUser(M.sender.split("@")[0]);
      let receiver = await Neko.user_db.getUser(user.split("@")[0]);

      if (action === "accept") {
        if (
          !sender?.proposal?.includes(receiver.user_id) ||
          sender.isMarried ||
          receiver.isMarried
        )
          return Neko.sendMentionMessage(
            M.from,
            getErrorMessage(sender, receiver),
            M,
          );

        await Neko.user_db.setMarried(M.sender, user, true);
        await Neko.user_db.setMarried(user, M.sender, true);
        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* and *@${user.split("@")[0]}* are now married!`,
          [M.sender, user],
          M,
        );
      } else if (action === "reject") {
        if (!sender.proposal?.includes(receiver.user_id))
          return Neko.sendTextMessage(
            M.from,
            "No marriage request found from this user.",
            M,
          );

        await Neko.user_db.rejectProposal(M.sender, user);
        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* has rejected the marriage proposal from *@${user.split("@")[0]}*`,
          [M.sender, user],
          M,
        );
      } else {
        if (
          sender.partner === receiver.user_id ||
          sender.user_id === receiver.user_id ||
          sender.isMarried ||
          receiver.isMarried ||
          sender.proposal?.includes(receiver.user_id)
        )
          return Neko.sendMentionMessage(
            M.from,
            getErrorMessage(sender, receiver),
            M,
          );

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

const getErrorMessage = (sender, receiver) => {
  if (sender.partner === receiver.user_id)
    return `*@${sender.user_id.split("@")[0]}* is already married to *@${receiver.user_id.split("@")[0]}*`;
  if (sender.user_id === receiver.user_id)
    return `*@${sender.user_id.split("@")[0]}* can't marry himself...`;
  if (sender.isMarried)
    return `You are already married to *@${sender.partner.split("@")[0]}*... don't be a cheater 😕 baka..!`;
  if (receiver.isMarried)
    return `Sorry You are quite late😔 *@${receiver.user_id.split("@")[0]}* has already fallen for *@${receiver.partner.split("@")[0]}* ♥️🌚`;
  if (sender?.proposal?.includes(receiver.user_id))
    return `*@${sender.user_id.split("@")[0]}* has already sent a marriage proposal to *@${receiver.user_id.split("@")[0]}*`;
  return "No marriage request found from this user.";
};
