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
        PHONE_NUMBER: process.env.PHONE_NUMBER || "1234567890",
      }
    }
  ]
};