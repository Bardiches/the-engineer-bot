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
      connection.subscribe(audioPlayer);
      await entersState(audioPlayer, AudioPlayerStatus.Idle, 30e3);

      connection.destroy();
      audioPlayer.removeAllListeners();
    }
  }
};
