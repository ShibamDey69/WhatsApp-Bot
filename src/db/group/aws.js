import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";

import { LRUCache } from "lru-cache";

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = "WhatsappGroups";

// Setup cache (500 items max, 10 minutes TTL)
const groupCache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 10,
});

class groupDBFunc {
  async getGroup(groupId, groupName) {
    if (!groupId.endsWith("@g.us")) return;

    const GroupId = groupId.replace("@g.us", "");

    // ✅ Check cache first
    if (groupCache.has(GroupId)) return groupCache.get(GroupId);

    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { groupId: GroupId },
    });

    const result = await docClient.send(command);

    if (result.Item) {
      groupCache.set(GroupId, result.Item); // Cache it
      return result.Item;
    }

    const newGroup = {
      groupId: GroupId,
      jid: groupId,
      name: groupName || "No Name Found",
      mode: "private",
      isBanned: false,
      isAntilink: false,
      isWelcome: false,
      isReassign: false,
      isNsfw: false,
      isAntiNsfw: false,
      isChatAi: false,
      createdAt: Date.now(),
    };

    await this.setGroup(GroupId, newGroup);
    groupCache.set(GroupId, newGroup); // Cache new group
    return newGroup;
  }

  async filterGroup(key, value) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#k = :v",
      ExpressionAttributeNames: { "#k": key },
      ExpressionAttributeValues: { ":v": value },
    });

    const result = await docClient.send(command);
    return result.Items || [];
  }

  async setGroup(groupId, data) {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...data,
        groupId,
      },
    });
    await docClient.send(command);
    groupCache.set(groupId, data); // Update cache
    return data;
  }

  async updateGroupAttr(groupId, key, value) {
    const GroupId = groupId.replace("@g.us", "");
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { groupId: GroupId },
      UpdateExpression: `SET #key = :val`,
      ExpressionAttributeNames: { "#key": key },
      ExpressionAttributeValues: { ":val": value },
    });
    await docClient.send(command);

    // ⚠️ Update the cached item as well (if exists)
    if (groupCache.has(GroupId)) {
      const group = groupCache.get(GroupId);
      group[key] = value;
      groupCache.set(GroupId, group);
    }
  }

  async setGcBanned(groupId, state = true) {
    await this.updateGroupAttr(groupId, "isBanned", state);
  }
  async setGcAntilink(groupId, state = true) {
    await this.updateGroupAttr(groupId, "isAntilink", state);
  }
  async setGcWelcome(groupId, state = true) {
    await this.updateGroupAttr(groupId, "isWelcome", state);
  }
  async setGcReassign(groupId, state = true) {
    await this.updateGroupAttr(groupId, "isReassign", state);
  }
  async setGcNsfw(groupId, state = true) {
    await this.updateGroupAttr(groupId, "isNsfw", state);
  }
  async setGcAntiNsfw(groupId, state = true) {
    await this.updateGroupAttr(groupId, "isAntiNsfw", state);
  }
  async setGcChatAi(groupId, state = true) {
    await this.updateGroupAttr(groupId, "isChatAi", state);
  }
  async setGcMode(groupId, mode = "private") {
    await this.updateGroupAttr(groupId, "mode", mode);
  }
}

export default groupDBFunc;
