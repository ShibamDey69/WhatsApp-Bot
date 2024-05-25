export default {
  name: "test",
  description: "Test Command",
  category: "test",
  isOwner:false,
  run: async (Neko, M) => {
    try {
       await Neko.sendTextMessage(M.from, "Test Command",M);
    } catch (error) {
       throw new Error(error);
    }
  }
}