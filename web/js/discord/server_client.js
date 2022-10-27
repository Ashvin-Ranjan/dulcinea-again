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
  }

  initialize(token, port) {
    this.token = token;
    this.baseURL = `ws://localhost:${port}`;
    this.websocket = null;
  }

  async connect() {
    this.websocket = new WebSocket(this.baseURL);
    this.websocket.onopen = () =>
      this.websocket.send(
        JSON.stringify({ type: 'initialize', token: this.token })
      );
    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.intent) {
        case 'guilds':
          this.guildCache = data.data;
          this.guildStateUpdate();
          break;
      }
    };
  }

  setGuildStateUpdate(func) {
    this.guildStateUpdate = func;
  }
}
