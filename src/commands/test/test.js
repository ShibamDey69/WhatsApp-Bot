export default {
  name: "test",
  description: "Test Command",
  category: "test",
  isOwner: false,
  run: async (Neko, M) => {
    try {
      if (M.args.includes("--error")) {
        throw new Error("Fake error");
      }
      await Neko.sendTextMessage(M.from, "Test Command", M);
    } catch (error) {
      await Neko.error(error);
    }
  },
};
