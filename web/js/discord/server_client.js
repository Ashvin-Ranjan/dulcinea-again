class ClientError extends Error {
  constructor(message) {
    super(message);
  }
}

export class CannotConnectError extends ClientError {
  constructor() {
    super('Cannot Connect because something else is already connected');
  }
}

export class HTTPError extends ClientError {
  constructor(message, code) {
    super(`CODE: ${code}\nMESSAGE: ${message}`);
  }
}

export default class Client {
  constructor() {
    this.token = '';
    this.baseURL = '';
    this.guildCache = [];
    this.guildStateUpdate = () => {};
    this.websocket = null;
    this.user = null;
    this.dmUpdates = new Map();
  }

  initialize(token, port) {
    this.token = token;
    this.baseURL = `ws://localhost:${port}`;
  }

  async connect() {
    this.websocket = new WebSocket(this.baseURL);
    this.websocket.onopen = () =>
      this.websocket.send(
        JSON.stringify({ type: 'initialize', data: this.token })
      );
    this.websocket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      switch (data.intent) {
        case 'initialize':
          this.guildCache = data.data.guilds;
          this.guildStateUpdate();
          this.user = data.data.user;
          break;
        case 'guilds':
          this.guildCache = data.data;
          this.guildStateUpdate();
          break;
        case 'dm':
          if (this.dmUpdates.has(data.data.author.id))
            await this.dmUpdates.get(data.data.author.id)(data.data);
          break;
      }
    };
  }

  async send(id, message) {
    this.websocket.send(
      JSON.stringify({ type: 'message', data: { id, message } })
    );
  }

  setGuildStateUpdate(func) {
    this.guildStateUpdate = func;
  }
}
