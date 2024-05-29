export default {
  apps: [
    {
      name: "SHIBAM",
      script: "src/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        SESSION_ID: "SHIBAM"
      }
    },
    {
      name: "ADI",
      script: "src/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        SESSION_ID:"ADI"
      }
    }
  ]
};