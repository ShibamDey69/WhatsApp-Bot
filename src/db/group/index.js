import groupDBJson from "./json.js";
import groupDBDynamo from "./aws.js";

function isAwsAvailable() {
  return (
    process.env.USE_AWS === "true" &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

const groupDB = isAwsAvailable() ? new groupDBDynamo() : new groupDBJson();

export default groupDB;
