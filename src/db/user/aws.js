import { LRUCache } from "lru-cache";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = "WhatsappUsers";

// Cache configuration
const userCache = new LRUCache({
  max: 500, // store max 500 users
  ttl: 1000 * 60 * 10, // 10 minutes
});

class userDBFunc {
  async getUser(Sender, name) {
    if (Sender.endsWith("@g.us")) return;

    const userId = Sender.replace("@s.whatsapp.net", "");

    // 🧠 Check cache first
    if (userCache.has(userId)) {
      return userCache.get(userId);
    }

    const { Item } = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId },
      }),
    );

    if (Item) {
      userCache.set(userId, Item);
      return Item;
    }

    const newUser = {
      userId,
      username: name || "No Name Found",
      isPro: false,
      isBanned: false,
      isMod: false,
      isMarried: false,
      partner: null,
      isStatusView: false,
      proposal: [],
      createdAt: Date.now(),
    };

    await this.setUser(userId, newUser);
    userCache.set(userId, newUser); // add to cache
    return newUser;
  }

  async setUser(userId, data) {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...data, userId },
      }),
    );
    userCache.set(userId, data); // update cache
    return data;
  }

  async updateUserAttr(Sender, updates) {
    if (Sender.endsWith("@g.us")) return;

    const userId = Sender.replace("@s.whatsapp.net", "");

    const expressions = Object.entries(updates).map(
      ([k], i) => `#k${i} = :v${i}`,
    );

    const ExpressionAttributeNames = Object.fromEntries(
      Object.keys(updates).map((k, i) => [`#k${i}`, k]),
    );

    const ExpressionAttributeValues = Object.fromEntries(
      Object.values(updates).map((v, i) => [`:v${i}`, v]),
    );

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId },
        UpdateExpression: `SET ${expressions.join(", ")}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      }),
    );

    // 🔄 Refresh cache
    const existing = userCache.get(userId) || {};
    userCache.set(userId, { ...existing, ...updates });
  }

  // The rest remains unchanged...
  async filterUser(key, value) {
    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#k = :v",
        ExpressionAttributeNames: { "#k": key },
        ExpressionAttributeValues: { ":v": value },
      }),
    );
    return Items || [];
  }

  async setPro(Sender, state = true) {
    await this.updateUserAttr(Sender, { isPro: state });
  }

  async setBanned(Sender, state = true) {
    await this.updateUserAttr(Sender, { isBanned: state });
  }

  async setMod(Sender, state = true) {
    await this.updateUserAttr(Sender, { isMod: state });
  }

  async setMarried(Sender, partner, state = true) {
    await this.updateUserAttr(Sender, {
      isMarried: state,
      partner,
      proposal: [],
    });
  }

  async addProposal(Sender, partner) {
    if (Sender.endsWith("@g.us")) return;
    const user = await this.getUser(Sender);
    const newProposal = [...(user.proposal || []), partner];
    await this.updateUserAttr(Sender, { proposal: newProposal });
  }

  async rejectProposal(Sender, partner) {
    if (Sender.endsWith("@g.us")) return;
    const user = await this.getUser(Sender);
    const newProposal = (user.proposal || []).filter((p) => p !== partner);
    await this.updateUserAttr(Sender, { proposal: newProposal });
  }

  async setStatusView(Sender, state = true) {
    await this.updateUserAttr(Sender, { isStatusView: state });
  }
}

export default userDBFunc;
