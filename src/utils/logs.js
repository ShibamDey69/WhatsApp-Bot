import clc from "cli-color";
const Log = async (type, text, text2, This) => {
  switch (type.toString().toLowerCase()) {
    case "status":
      return console.log(
        clc.green.bold("["),
        clc.yellow.bold(text),
        clc.green.bold("]"),
        clc.blue(text2),
      );
    case "info":
      return console.log(
        clc.green.bold("["),
        clc.yellow.bold("INFO"),
        clc.green.bold("]"),
        clc.blue(text),
      );
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
        clc.blue(This.time),
        clc.green(text),
      );
    case "exec":
      return console.log(
        clc.green.bold("["),
        clc.magenta.bold("EXEC"),
        clc.green.bold("]"),
        clc.blue(This.time),
        clc.green(text),
      );
    case "connect":
      return console.log(clc.green.bold("[ ! ]"), clc.blue(text));
    case "message":
      return console.log(clc.green.bold("[msg]"), clc.blue(text));
  }
};

export default Log;
