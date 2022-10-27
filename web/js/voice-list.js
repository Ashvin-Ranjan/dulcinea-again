import { MemberList } from './member-list.js';

const { createElement: e, useEffect, useState } = React;

function VoiceChannelList({ client, onChannel }) {
  const [guilds, setGuilds] = useState(client.guildCache);

  useEffect(() => {
    client.setGuildStateUpdate(() => setGuilds(client.guildCache));
    return () => {
      client.setGuildStateUpdate(() => {});
    };
  }, [client.guildCache]);

  return e(
    'div',
    { className: 'vc-list-wrapper' },
    e(
      'h1',
      { className: 'vc-list-heading big-bold' },
      'Select a voice channel.'
    ),
    e(
      'div',
      { className: 'vc-list' },
      guilds.map((guild) =>
        e(
          'div',
          { className: 'vc-guild-wrapper', key: guild.id },
          e(
            'h2',
            { className: 'vc-guild-name' },
            guild.icon
              ? e('img', {
                  className: 'vc-guild-icon',
                  src: guild.icon,
                })
              : e('div', {
                  className: 'vc-guild-icon vc-guild-no-icon',
                }),
            e('span', { className: 'vc-guild-name-span' }, guild.name)
          ),
          guild.channels.map((channel) =>
            e(
              'button',
              {
                className: 'vc-voice-channel',
                onClick: () => onChannel(channel.id),
                key: channel.id,
              },
              e('span', { className: 'vc-voice-channel-name' }, channel.name),
              channel.members.length > 0 &&
                e(
                  'span',
                  { className: 'vc-voice-channel-members' },
                  channel.members.length
                )
            )
          ),
          guild.channels.length === 0 &&
            e('div', { className: 'vc-no-vc' }, 'No voice channels')
        )
      ),
      guilds.length === 0 &&
        e('div', { className: 'vc-no-vc' }, 'The bot is not in any servers')
    )
  );
}

function VcOrMemberList({ client, onStart }) {
  const [channel, setChannel] = useState(null);

  if (channel) {
    return e(MemberList, {
      channel,
      onStart: () => onStart(channel),
      onBack: () => setChannel(null),
    });
  } else {
    return e(VoiceChannelList, {
      client,
      onChannel: (channelId) => {
        const channel = client.guildCache
          .filter(
            (g) => g.channels.filter((v) => v.id == channelId).length == 1
          )[0]
          .channels.filter((v) => v.id == channelId)[0];
        if (channel) {
          console.log(channel);
          setChannel(channel);
        }
      },
    });
  }
}

export function selectVoiceChannel(client, root) {
  return new Promise((resolve) => {
    ReactDOM.render(
      e(
        React.StrictMode,
        null,
        e(VcOrMemberList, {
          client,
          onStart: resolve,
        })
      ),
      root
    );
  }).then((channel) => {
    ReactDOM.unmountComponentAtNode(root);
    return channel;
  });
}
