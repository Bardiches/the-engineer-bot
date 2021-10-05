import { randomBytes } from 'crypto';
import { Client, GuildMember, Intents, MessageAttachment, MessageEmbed } from 'discord.js';
import { getAI, getAIWav } from './api';
import { playAudio } from './audio';
import Characters from './characters.json';

const token = process.env.TOKEN || '';

const toID = (text: string) =>text.toLowerCase().replace(/[^a-z0-9]+/g, '');

interface Character {
  name: string;
  franchise: string;
  emotions: string[];
}

const characterMap = Characters.reduce((
  currentCharacterMap, 
  character,
) => {
  currentCharacterMap[toID(character.name)] = {
    name: character.name,
    franchise: character.franchise,
    emotions: character.emotions,
  };

  return currentCharacterMap;
}, {} as Record<string, Character>);

const franchiseCharacterMap = Characters.reduce((
  currentFranchiseCharacterMap, 
  character,
) => {
  if (!currentFranchiseCharacterMap[toID(character.franchise)]) {
    currentFranchiseCharacterMap[toID(character.franchise)] = {
      name: character.franchise,
      characters: {},
    };
  }

  currentFranchiseCharacterMap[toID(character.franchise)].characters[toID(character.name)] = {
    name: character.name,
    franchise: character.franchise,
    emotions: character.emotions,
  };

  return currentFranchiseCharacterMap;
}, {} as Record<string, { name: string, characters: Record<string, Character> }>);

const getEmotionOrDefault = (character: Character, emotionId: string) => {
  const emotion = character.emotions.find((emotion) => toID(emotion) === emotionId);

  return emotion ?? character.emotions[0];
};

const initialize = async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES],
  });
  
  client.on('ready', (client) => {
    client.on('interactionCreate', async (interaction) => {
      try {
        if (!interaction.isCommand()) return;

        if (interaction.commandName === 'ai') {
          const subcommand = interaction.options.getSubcommand();

          if (subcommand === 'generate') {
            const characterOption = interaction.options.getString('character', true);
            const emotionOption = interaction.options.getString('emotion');
            const textOption = interaction.options.getString('text', true);
            const play = interaction.options.getBoolean('play', false) || false;

            if (characterOption && textOption) {
              const character = characterMap[toID(characterOption)];

              if (character) {
                const emotion = getEmotionOrDefault(character, toID(emotionOption || ''));

                await interaction.deferReply();

                try {
                  const response = await getAI({
                    text: textOption,
                    character: character.name,
                    emotion: emotion,
                  });
                  const randomId = randomBytes(6).toString('hex');
                  const audioStream = await getAIWav(response.wavNames[0]);
                  const attachment = new MessageAttachment(
                    audioStream,
                    `${toID(character.name)}-${randomId}.wav`
                  );
                  
                  await interaction.editReply({
                    files: [attachment],
                  });

                  if (play) {
                    console.log('playing...');
                    await playAudio(interaction, `https://cdn.15.ai/audio/${response.wavNames[0]}`);
                  }
                } catch (error) {
                  console.log(error);
                  await interaction.editReply({
                    content: 'An unknown error occured. Try again.',
                  });
                }
              }
            }
          } else if (subcommand === 'characters') {
            const franchiseOption = interaction.options.getString('franchise', true);
            const franchise = franchiseCharacterMap[toID(franchiseOption)];

            if (franchise) {
              const embed = new MessageEmbed();
              embed.setTitle(`15.ai ${franchise.name} Characters`);
              embed.setURL('https://15.ai');
              embed.setFields(Object.values(franchise.characters)
                .map((character) => ({
                  name: character.name,
                  value: `Emotions: ${character.emotions.join(',')}`,
                  inline: true,
                })));

              await interaction.reply({
                ephemeral: true,
                embeds: [embed],
              });
            }
          } else if (subcommand === 'franchises') {
            const embed = new MessageEmbed();
            embed.setTitle(`15.ai Franchises`);
            embed.setURL('https://15.ai');
            embed.setFields(Object.values(franchiseCharacterMap)
              .map(({ name, characters }) => ({
                name: name,
                value: `${Object.values(characters).length} character(s)`,
                inline: true,
              })));

            await interaction.reply({
              ephemeral: true,
              embeds: [embed],
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    });
  });
  
  await client.login(token);
};

initialize();
