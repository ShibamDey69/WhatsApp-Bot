export default {
  name: "divorce",
  aliases: ["divorce"],
  description: "Initiate or respond to a divorce request",
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
          "Please mention or quote your partner to divorce.",
          M,
        );

      let sender = await Neko.user_db.getUser(M.sender.split("@")[0]);
      let receiver = await Neko.user_db.getUser(user.split("@")[0]);

      if (action === "accept") {
        if (
          !sender?.proposal?.includes(receiver.user_id) ||
          !sender.isMarried ||
          sender.partner !== receiver.user_id
        ) {
          let ErrorMess = getErrorMessage(sender, receiver);
          return await Neko.sendMentionMessage(
            M.from,
            ErrorMess.text,
            [...ErrorMess.mention],
            M,
          );
        }
        await Neko.user_db.setMarried(M.sender, undefined, false);
        await Neko.user_db.setMarried(user, undefined, false);
        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* and *@${user.split("@")[0]}* are now divorced.`,
          [M.sender, user],
          M,
        );
      } else if (action === "reject") {
        if (!sender.proposal?.includes(receiver.user_id))
          return Neko.sendTextMessage(
            M.from,
            "No divorce request found from this user.",
            M,
          );

        await Neko.user_db.rejectProposal(M.sender, user);
        return Neko.sendMentionMessage(
          M.from,
          `*@${M.sender.split("@")[0]}* has rejected the divorce proposal from *@${user.split("@")[0]}*`,
          [M.sender, user],
          M,
        );
      } else {
        if (
          !sender.isMarried ||
          sender.partner !== receiver.user_id ||
          sender.proposal?.includes(receiver.user_id)
        ) {
          let ErrorMess = getErrorMessage(sender, receiver);
          return await Neko.sendMentionMessage(
            M.from,
            ErrorMess.text,
            [...ErrorMess.mention],
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

const getErrorMessage = (sender, receiver) => {
  if (!sender) return { text: "User not found in the database.", mention: [] };
  if (!receiver)
    return { text: "Mentioned user not found in the database.", mention: [] };
  if (!sender.isMarried || sender.partner !== receiver.user_id)
    return {
      text: `You are not married to *@${receiver.user_id.split("@")[0]}*`,
      mention: [receiver.user_id],
    };
  if (sender?.proposal?.includes(receiver.user_id))
    return {
      text: `*@${sender.user_id.split("@")[0]}* has already sent a divorce request to *@${receiver.user_id.split("@")[0]}*`,
      mention: [sender.user_id, receiver.user_id],
    };
  return {
    text: "No divorce request found from this user.",
    mention: [sender.user_id],
  };
};
