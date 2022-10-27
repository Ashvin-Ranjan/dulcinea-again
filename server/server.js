const { Client, GatewayIntentBits } = require('discord.js');
const ws = require('ws');

// Get config
const config = require('./config');

// Some helper stuff
const info = (message) => {
  console.log(`\u001b[36m[INFO]\u001b[m: ${message}`);
};

const debug = (message) => {
  console.log(`\u001b[32m[DEBUG]\u001b[m: ${message}`);
};

const error = (message) => {
  console.log(`\u001b[31m[ERROR]\u001b[m: ${message}`);
};

// Other functions
const guildData = () => {
  return Array.from(client.guilds.cache.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((guild) => {
      const icon = guild.iconURL({
        format: 'png',
        dynamic: true,
        size: 32,
      });
      const channels = Array.from(guild.channels.cache.values())
        // 2 is now the type for vc apperently
        .filter((channel) => channel.type === 2)
        .sort((a, b) =>
          a.parent === b.parent
            ? a.rawPosition - b.rawPosition
            : (a.parent ? a.parent.rawPosition : 0) -
              (b.parent ? b.parent.rawPosition : 0)
        )
        .map((channel) => {
          return {
            id: channel.id,
            name: channel.name,
            members: [...channel.members].map((v) => ({
              id: v[0],
              ...v[1],
              user: v[1].user,
            })),
          };
        });

      return {
        id: guild.id,
        icon,
        name: guild.name,
        channels,
      };
    });
};

const loginToDiscord = async (token) => {
  client = new Client({
    intents: [
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  client.login(token);
  await new Promise((resolve) => {
    client.once('ready', resolve);
  });

  return JSON.stringify({
    intent: 'initialize',
    data: { guilds: guildData(), user: client.user },
  });
};

let client = null;
let currentlyConnected = false;

const wsServer = new ws.Server({
  port: config.port,
});
wsServer.on('connection', async (socket) => {
  if (currentlyConnected) {
    error('Website attempting to connect, refusing connection');
    websocket.terminate();
    return;
  }

  info('Accepted website attempt to connect');

  currentlyConnected = true;

  info('Data sent to client');

  socket.on('message', async (message) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'initialize':
        info('Initializing discord client');
        socket.send(await loginToDiscord(data.data));
        client.on('voiceStateUpdate', async (_old, _new) => {
          info('VC Updated, sending data to client');
          socket.send(JSON.stringify({ intent: 'guilds', data: guildData() }));
        });
        info('Initialized discord client');
        break;
      case 'message':
        info('Sending message to user');
        await client.users.cache.get(data.data.id).send(data.data.message);
        info('Sent message to user');
        break;
    }
  });
  socket.on('close', () => {
    info('Connection closing');
    currentlyConnected = false;
    client.destroy();
    info('Reset to initial state');
  });
});

info(`Server initialized on port ${config.port}`);
