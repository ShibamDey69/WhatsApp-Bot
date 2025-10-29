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

const userCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 10,
});

class UserDBFunc {
  #getId(Sender) {
    return Sender.replace("@lid", "");
  }

  async getUser(Sender, senderPn, name) {
    if (!Sender.endsWith("@lid")) return;
    const userId = this.#getId(Sender);

    if (userCache.has(userId)) {
      return userCache.get(userId);
    }

    const { Item } = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId },
      })
    );

    if (Item) {
      userCache.set(userId, Item);
      return Item;
    }

    const newUser = {
      userId,
      senderPn,
      name: name || "Unknown User",
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
    userCache.set(userId, newUser);
    return newUser;
  }

  async getUserByPn(senderPn) {
    const cached = [...userCache.values()].find(
      (user) => user.senderPn === senderPn
    );
    if (cached) return cached;

    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#pn = :pn",
        ExpressionAttributeNames: { "#pn": "senderPn" },
        ExpressionAttributeValues: { ":pn": senderPn },
      })
    );

    return Items?.[0] || null;
  }

  async setUser(userId, data) {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...data, userId },
      })
    );
    userCache.set(userId, data);
    return data;
  }

  async #updateUserAttr(Sender, updates) {
    if (!Sender.endsWith("@lid")) return;
    const userId = this.#getId(Sender);

    const expressions = Object.entries(updates).map(
      ([k], i) => `#k${i} = :v${i}`
    );

    const ExpressionAttributeNames = Object.fromEntries(
      Object.keys(updates).map((k, i) => [`#k${i}`, k])
    );

    const ExpressionAttributeValues = Object.fromEntries(
      Object.values(updates).map((v, i) => [`:v${i}`, v])
    );

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId },
        UpdateExpression: `SET ${expressions.join(", ")}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      })
    );

    const existing = userCache.get(userId) || {};
    userCache.set(userId, { ...existing, ...updates });
  }

  async filterUser(key, value) {
    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#k = :v",
        ExpressionAttributeNames: { "#k": key },
        ExpressionAttributeValues: { ":v": value },
      })
    );
    return Items || [];
  }

  async setPro(Sender, state = true) {
    await this.#updateUserAttr(Sender, { isPro: state });
  }

  async setBanned(Sender, state = true) {
    await this.#updateUserAttr(Sender, { isBanned: state });
  }

  async setMod(Sender, state = true) {
    await this.#updateUserAttr(Sender, { isMod: state });
  }

  async setStatusView(Sender, state = true) {
    await this.#updateUserAttr(Sender, { isStatusView: state });
  }

  async setMarried(Sender, partner, state = true) {
    await this.#updateUserAttr(Sender, {
      isMarried: state,
      partner,
      proposal: [],
    });
  }

  async addProposal(Sender, partner) {
    if (Sender.endsWith("@g.us")) return;
    const user = await this.getUser(Sender);
    const newProposal = [...(user.proposal || []), partner];
    await this.#updateUserAttr(Sender, { proposal: newProposal });
  }

  async rejectProposal(Sender, partner) {
    if (Sender.endsWith("@g.us")) return;
    const user = await this.getUser(Sender);
    const newProposal = (user.proposal || []).filter((p) => p !== partner);
    await this.#updateUserAttr(Sender, { proposal: newProposal });
  }
}

export default UserDBFunc;
