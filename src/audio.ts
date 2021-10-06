import {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import { CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';

export const playAudio = async (
  interaction: CommandInteraction,
  audioFile: string,
) => {
  const audioPlayer = createAudioPlayer();
  const audioResource = createAudioResource(audioFile, { inputType: StreamType.Arbitrary });

  audioPlayer.play(audioResource);

  await entersState(audioPlayer, AudioPlayerStatus.Playing, 5e3);

  if (interaction.member instanceof GuildMember) {
    const channel = interaction.member.voice.channel;

    if (channel instanceof VoiceChannel) {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guildId,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30e3);

      await new Promise<void>(async (resolve) => {
        try {
          await new Promise<void>(async (resolveInner) => {
            setInterval(() => {
              connection.subscribe(audioPlayer);
      
              audioPlayer.on('stateChange', (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Idle) {
                  setInterval(() => {
                    resolveInner();
                  }, 2000);
                }
              });
            }, 2000);
          });
          resolve();
        } catch (error) {
          resolve();
        }
      });

      connection.disconnect();
    }
  }
};
