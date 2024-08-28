import fs from "fs";
const commands = new Map();

const loadCommands = () => {
  return new Promise(async (resolve, reject) => {
    if (fs.existsSync(`src/commands`)) {
      let folders = fs.readdirSync(`src/commands`);
      for (let folder of folders) {
        let files = fs.readdirSync(`src/commands/${folder}`);
        for (let file of files) {
          let cmd = await import(`../commands/${folder}/${file}`);
          commands.set(cmd.default?.name, cmd.default);
          cmd.default?.aliases?.forEach((cmdName) =>
            commands.set(cmdName, cmd.default),
          );
        }
      }
      resolve(commands);
    }
  });
};

export default loadCommands;
