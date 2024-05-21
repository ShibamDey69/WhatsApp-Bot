export default {
  name: "test",
  description: "Test Command",
  isOwner:false,
  run: async (Neko, M) => {
    try {
       await Neko.sendTextMessage(M.from, "Test Command",M);
    } catch (error) {
       throw new Error(error);
    }
  }
}