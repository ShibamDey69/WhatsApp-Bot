import userDBJson from "./json.js";
import userDBDynamo from "./aws.js";

function isAwsAvailable() {
  return (
    process.env.USE_AWS === "true" &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

const userDB = isAwsAvailable() ? new userDBDynamo() : new userDBJson();

export default userDB;
