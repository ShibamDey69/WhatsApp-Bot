import WebSocket from "ws";
import { v4 as uuid } from "uuid";
import EventEmitter from "events";

class CharacterAi extends EventEmitter {
  constructor(opt = {}) {
    super();
    this.url = "wss://neo.character.ai/ws/";
    this.token = opt.token;
    this.chat_id = opt.chat_id;
    this.author_id = opt.author_id;
    this.char_id = opt.char_id;
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.queue = [];
    this.chatCreateQueue = [];
    this.reqId = null;
    this.candidateId = null;
    this.turnId = null;
    this.isChatCreated = false;
  }

  connectSocket() {
    if (this.isConnecting || this.isConnected) return;
    this.isConnecting = true;

    const options = {
      headers: {
        Cookie: `HTTP_AUTHORIZATION="Token ${this.token}"`,
      },
    };

    this.ws = new WebSocket(this.url, options);

    this.ws.on("open", () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.emit("connected");
      this.processQueue();
    });

    this.ws.on("message", (res) => {
      let data;
      try {
        data = JSON.parse(res.toString());
      } catch (error) {
        this.emit("error", new Error("Failed to parse response"));
        return;
      }

      if (data?.command === "create_chat" && data?.success) {
        this.isChatCreated = true;
        this.processQueue();
      }

      if (!data?.turn?.author?.is_human) {
        let raw_text = data?.turn?.candidates[0]?.raw_content;
        if (raw_text) {
          this.emit("data", raw_text);
        }
      }

      if (
        data?.turn?.candidates[0]?.is_final &&
        !data?.turn?.author?.is_human
      ) {
        let final_text = data?.turn?.candidates[0]?.raw_content;
        this.emit("final.data", final_text);
        this.processQueue(); // Process any remaining messages in the queue
      }
    });

    this.ws.on("error", (err) => {
      this.emit("error", err);
      this.isConnected = false;
      this.isConnecting = false;
      setTimeout(() => this.connectSocket(), 5000);
    });

    this.ws.on("close", () => {
      this.isConnected = false;
      setTimeout(() => this.connectSocket(), 5000);
    });
  }

  processQueue() {
    while (this.chatCreateQueue.length > 0 && this.isConnected) {
      const payload = this.chatCreateQueue.shift();
      this.ws.send(JSON.stringify(payload));
    }
    while (this.queue.length > 0 && this.isConnected) {
      const payload = this.queue.shift();
      this.ws.send(JSON.stringify(payload));
    }
  }

  async send(message) {
    if (!this.isConnected) {
      this.connectSocket();
    }

    if (!this.isChatCreated) {
      await this.createChat(); // Create chat if not already created
    }

    await this.sendMessage(message);
  }

  async sendMessage(message) {
    this.candidateId = uuid();
    this.turnId = uuid();

    let payload = {
      command: "create_and_generate_turn",
      request_id: this.reqId,
      payload: {
        num_candidates: 1,
        tts_enabled: false,
        selected_language: "",
        character_id: this.char_id,
        user_name: "Neko",
        turn: {
          turn_key: {
            turn_id: this.turnId,
            chat_id: this.chat_id,
          },
          author: {
            author_id: this.author_id,
            is_human: true,
            name: "Neko",
          },
          candidates: [
            {
              candidate_id: this.candidateId,
              raw_content: message,
            },
          ],
          primary_candidate_id: this.candidateId,
        },
        previous_annotations: {
          boring: 0,
          not_boring: 0,
          inaccurate: 0,
          not_inaccurate: 0,
          repetitive: 0,
          not_repetitive: 0,
          out_of_character: 0,
          not_out_of_character: 0,
          bad_memory: 0,
          not_bad_memory: 0,
          long: 0,
          not_long: 0,
          short: 0,
          not_short: 0,
          ends_chat_early: 0,
          not_ends_chat_early: 0,
          funny: 0,
          not_funny: 0,
          interesting: 0,
          not_interesting: 0,
          helpful: 0,
          not_helpful: 0,
        },
      },
      origin_id: "web-next",
    };

    if (this.isConnected) {
      this.ws.send(JSON.stringify(payload));
      this.emit("message.sent", message); // Emit event when message is sent
    } else {
      this.queue.push(payload);
    }
  }

  async createChat() {
    if (!this.isConnected) {
      this.connectSocket();
    }
    this.reqId = uuid();
    let payload = {
      command: "create_chat",
      request_id: this.reqId,
      payload: {
        chat: {
          chat_id: this.chat_id,
          creator_id: this.author_id,
          visibility: "VISIBILITY_PRIVATE",
          character_id: this.char_id,
          type: "TYPE_ONE_ON_ONE",
        },
        with_greeting: true,
      },
      origin_id: "web-next",
    };

    if (this.isConnected) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.chatCreateQueue.push(payload);
    }
  }
}

export default CharacterAi;