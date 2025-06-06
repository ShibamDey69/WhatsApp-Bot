const { PROCESSABLE_HISTORY_TYPES } = require("@whiskeysockets/baileys");

module.exports = {
  apps: [
    {
      name: "SHIBAM",
      script: "src/index.js",
      instances: "1",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        SESSION_ID: "SHIBAM",
        PHONE_NUMBER: "917047584741", // Replace with your phone number
        PREFIX: "!",
        OWNER_NUMBER: "917047584741", // Replace with your WhatsApp number
      },
    },
  ],
};
