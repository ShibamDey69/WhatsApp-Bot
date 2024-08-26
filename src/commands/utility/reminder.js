export default {
  name: "reminder",
  aliases: ["remind", "alarm"],
  category: "Utility",
  description: "Set a reminder",
  usage: "reminder --time=[duration] [message]",
  cooldown: 5,
  isAdmin: false,
  isBotAdmin: false,
  isGroup: false,
  isOwner: false,
  isPro: false,
  isMod: false,
  run: async (Neko, M) => {
    try {
      let args = M.args;
      if (!args.includes("--time="))
        return Neko.sendTextMessage(
          M.from,
          "Please provide the duration with --time= and message for the reminder.",
          M,
        );

      let duration = args.split("--time=")[1].split(" ")[0];
      let message = args
        .split(" ")
        .slice(1)
        .join(" ")
        .replace(`--time=${duration} `, "");

      const durationInMs = parseDuration(duration);

      if (isNaN(durationInMs))
        return Neko.sendTextMessage(
          M.from,
          "Invalid duration format. Please use the format '[number][s/m/h/d]' (e.g., 30s, 1h, 2d).",
          M,
        );

      await Neko.sendTextMessage(
        M.from,
        `Done! Reminder set for *${duration}*!`,
        M,
      );
      setTimeout(() => {
        Neko.sendMentionMessage(
          M.from,
          `*Reminder:* *@${M.sender.split("@")[0]}* ${message}`,
          [M.sender, ...M.mention],
          M,
        );
      }, durationInMs);
    } catch (error) {
      await Neko.error(error);
    }
  },
};

function parseDuration(duration) {
  const durationRegex = /^(\d+)([smhd]?)$/i;
  const match = duration.match(durationRegex);

  if (!match) return NaN;

  const [, value, unit] = match;
  const parsedValue = parseInt(value, 10);

  switch (unit.toLowerCase()) {
    case "s":
      return parsedValue * 1000;
    case "m":
      return parsedValue * 60 * 1000;
    case "h":
      return parsedValue * 60 * 60 * 1000;
    case "d":
      return parsedValue * 24 * 60 * 60 * 1000;
    default:
      return parsedValue * 1000;
  }
}
