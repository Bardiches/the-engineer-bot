import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const token = process.env.TOKEN || '';
const applicationId = process.env.APPLICATION_ID || '';

const generateSlashCommands = async () => {
  const command = new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Commands for interacting with 15.ai')
    .addSubcommand(subCommand => subCommand
      .setName('generate')
      .setDescription('Generates a WAV file of a character saying a given phrase')
      .addStringOption(option => option
        .setName('character')
        .setDescription('The name of the character to impersonate')
        .setRequired(true))
      .addStringOption(option => option
        .setName('text')
        .setDescription('The message to impersonate')
        .setRequired(true))
      .addStringOption(option => option
        .setName('emotion')
        .setDescription('The emotion/inflection the message should be said in'))
      .addBooleanOption(option => option
        .setName('play')
        .setDescription('Whether or not to try to play the result in your current voice channel')))
    .addSubcommand(subCommand => subCommand
      .setName('franchises')
      .setDescription('Lists all franchises'))
    .addSubcommand(subCommand => subCommand
      .setName('characters')
      .setDescription('Lists all characters')
      .addStringOption(option => option
        .setName('franchise')
        .setDescription('The desired franchise')
        .setRequired(true)));

  const rest = new REST({ version: '9' })
    .setToken(token);

  await rest.put(
    Routes.applicationCommands(applicationId),
    { body: [
      command.toJSON(),
      { type: '2', name: 'Sneed' },
    ]},
  );
};

generateSlashCommands();
