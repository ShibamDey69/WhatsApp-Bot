import clc from "cli-color";
const Log = async (type, text, context = "PRIVATE") => {
  switch (type.toString().toLowerCase()) {
    case "error":
      return console.log(
        clc.green.bold("["),
        clc.red.bold("ERROR"),
        clc.green.bold("]"),
        clc.blue(text),
      );
    case "eval":
      return console.log(
        clc.green.bold("["),
        clc.magenta.bold("EVAL"),
        clc.green.bold("]"),
        clc.green(text),
      );
    case "exec":
      return console.log(
        clc.green.bold("["),
        clc.magenta.bold("EXEC"),
        clc.green.bold("]"),
        clc.green(text),
      );
    case "connect":
      return console.log(clc.green.bold("[ ! ]"), clc.blue(text));
    case "message":
      return console.log(
        clc.blueBright(`[${context.toUpperCase()}]`),
        clc.greenBright(
          `[${new Date().toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
          })}]`,
        ),
        clc.whiteBright(text),
      );
  }
};

export default Log;
