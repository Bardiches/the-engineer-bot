import {
	joinVoiceChannel,
	createAudioPlayer,
	createAudioResource,
	entersState,
	StreamType,
	AudioPlayerStatus,
	VoiceConnectionStatus,
  AudioPlayerState,
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

              const listener = (oldState: AudioPlayerState, newState: AudioPlayerState) => {
                if (newState.status === AudioPlayerStatus.Idle) {
                  setInterval(() => {
                    audioPlayer.removeListener('stateChange', listener);
                    resolveInner();
                  }, 2000);
                }
              };
      
              audioPlayer.on('stateChange', listener);

            }, 2000);
          });
          resolve();
        } catch (error) {
          resolve();
        }
      });

      connection.destroy();
      audioPlayer.removeAllListeners();
    }
  }
};
