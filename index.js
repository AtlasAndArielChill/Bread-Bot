/**
 * @file Duo Bot
 * @description A Discord bot that facilitates private duo channels for two users.
 * This script is designed to be self-contained in a single file for easy use.
 *
 * This version of the code is configured to run on a platform like Render,
 * which uses environment variables for secure credential management and includes a simple
 * web server to prevent the bot from going to sleep.
 *
 * Before running this bot on Render, ensure you have pushed this file to a GitHub
 * repository and set up the following environment variables on the Render dashboard:
 * - TOKEN
 * - CLIENT_ID
 * - GUILD_ID
 *
 * Render will automatically install dependencies from your package.json and run the app.
 */

// Import necessary classes from the discord.js library
const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const express = require('express');

// Create a web server to keep the bot alive
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(port, () => {
  console.log(`Web server listening on port ${port}`);
});

// Load credentials from environment variables, a secure practice for hosting.
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// In-memory storage for roles that can access duo channels and roles that can use the /duo command.
// This data will be reset whenever the bot restarts.
const channelAdminRoles = new Set();
const duoAllowedRoles = new Set();

// Create a new Discord client instance with the required intents.
// Intents define what events and data your bot can access.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Event handler for when the bot is ready and connected to Discord
client.once('ready', async () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);

  // Register the slash commands
  const commands = [
    new SlashCommandBuilder()
      .setName('duo')
      .setDescription('Sends a duo request to another user.')
      .addUserOption(option =>
        option.setName('username')
          .setDescription('The user to send the duo request to.')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('duobotrole')
      .setDescription('Sets which roles can access duo channels.')
      .addRoleOption(option =>
        option.setName('role1')
          .setDescription('The first role.')
          .setRequired(true)
      )
      .addRoleOption(option =>
        option.setName('role2')
          .setDescription('The second role.')
          .setRequired(false)
      )
      .addRoleOption(option =>
        option.setName('role3')
          .setDescription('The third role.')
          .setRequired(false)
      ),
    new SlashCommandBuilder()
      .setName('duo_allowed_role')
      .setDescription('Sets which roles are allowed to use the /duo command.')
      .addRoleOption(option =>
        option.setName('role1')
          .setDescription('The first role.')
          .setRequired(true)
      )
      .addRoleOption(option =>
        option.setName('role2')
          .setDescription('The second role.')
          .setRequired(false)
      )
      .addRoleOption(option =>
        option.setName('role3')
          .setDescription('The third role.')
          .setRequired(false)
      ),
  ].map(command => command.toJSON());

  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.commands.set(commands);
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

// Event handler for when a user interacts with the bot (e.g., using a slash command)
client.on('interactionCreate', async interaction => {
  // Ignore interactions that are not slash commands or button interactions
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  // Handle the /duo command
  if (interaction.isChatInputCommand() && interaction.commandName === 'duo') {
    const targetUser = interaction.options.getUser('username');
    const initiator = interaction.user;

    // Check if the user is allowed to use the /duo command
    const memberRoles = interaction.member.roles.cache;
    const isAllowed = Array.from(duoAllowedRoles).some(roleId => memberRoles.has(roleId));

    if (duoAllowedRoles.size > 0 && !isAllowed) {
      return interaction.reply({
        content: 'You do not have the required role to use this command.',
        ephemeral: true
      });
    }

    // Prevent a user from sending a duo request to themselves
    if (targetUser.id === initiator.id) {
      return interaction.reply({ content: 'You cannot send a duo request to yourself!', ephemeral: true });
    }

    // Create an embed for the duo request
    const duoRequestEmbed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Duo Request')
      .setDescription(`**${initiator.username}** wants to start a duo with you!`)
      .setAuthor({ name: initiator.username, iconURL: initiator.displayAvatarURL() })
      .setTimestamp();

    // Create buttons for accepting or declining the request
    const acceptButton = new ButtonBuilder()
      .setCustomId('accept_duo_' + initiator.id + '_' + targetUser.id)
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success);

    const declineButton = new ButtonBuilder()
      .setCustomId('decline_duo_' + initiator.id + '_' + targetUser.id)
      .setLabel('Decline')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

    // Send the duo request as a private message (DM) to the target user.
    try {
      await targetUser.send({
        embeds: [duoRequestEmbed],
        components: [row]
      });
      // Reply to the sender privately (ephemerally)
      await interaction.reply({
        content: `Your duo request has been sent to ${targetUser}!`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Failed to send DM to target user:', error);
      await interaction.reply({
        content: `Failed to send the duo request to ${targetUser}. They may have DMs disabled.`,
        ephemeral: true
      });
    }
  }

  // Handle the /duobotrole command
  if (interaction.isChatInputCommand() && interaction.commandName === 'duobotrole') {
    // Clear the existing roles before adding new ones
    channelAdminRoles.clear();

    const role1 = interaction.options.getRole('role1');
    const role2 = interaction.options.getRole('role2');
    const role3 = interaction.options.getRole('role3');

    // Add the selected roles to the in-memory set
    channelAdminRoles.add(role1.id);
    if (role2) channelAdminRoles.add(role2.id);
    if (role3) channelAdminRoles.add(role3.id);

    // Get the names of the roles for the confirmation message
    const roleNames = [role1, role2, role3].filter(r => r).map(r => r.name).join(', ');

    await interaction.reply({
      content: `Access to duo channels has been granted to the following roles: **${roleNames}**. Note: This setting will be reset if the bot restarts.`,
      ephemeral: true
    });
  }

  // Handle the new /duo_allowed_role command
  if (interaction.isChatInputCommand() && interaction.commandName === 'duo_allowed_role') {
    // Clear the existing roles before adding new ones
    duoAllowedRoles.clear();

    const role1 = interaction.options.getRole('role1');
    const role2 = interaction.options.getRole('role2');
    const role3 = interaction.options.getRole('role3');

    // Add the selected roles to the in-memory set
    duoAllowedRoles.add(role1.id);
    if (role2) duoAllowedRoles.add(role2.id);
    if (role3) duoAllowedRoles.add(role3.id);

    // Get the names of the roles for the confirmation message
    const roleNames = [role1, role2, role3].filter(r => r).map(r => r.name).join(', ');

    await interaction.reply({
      content: `Users with the following roles are now allowed to use the /duo command: **${roleNames}**. Note: This setting will be reset if the bot restarts.`,
      ephemeral: true
    });
  }

  // Handle button interactions
  if (interaction.isButton()) {
      const [action, initiatorId, targetId] = interaction.customId.split('_');
      const initiator = await client.users.fetch(initiatorId);
      const targetUser = await client.users.fetch(targetId);

      // Check if the button was clicked by the correct recipient
      if (interaction.user.id !== targetUser.id) {
          return interaction.reply({ content: 'This request is not for you!', ephemeral: true });
      }

      if (action === 'accept_duo') {
        // Create the private duo channel
        const duoChannel = await interaction.guild.channels.create({
          name: `duo-${initiator.username}-${targetUser.username}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: initiator.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
            {
              id: targetUser.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
            ...Array.from(channelAdminRoles).map(roleId => ({
              id: roleId,
              allow: [PermissionsBitField.Flags.ViewChannel],
            })),
          ],
        });

        await interaction.update({ content: `Duo accepted! A new channel has been created: ${duoChannel}`, embeds: [], components: [] });
        await duoChannel.send(`Welcome to your private duo channel, ${initiator} and ${targetUser}!`);

      } else if (action === 'decline_duo') {
        await interaction.update({ content: 'The duo request was declined.', embeds: [], components: [] });
      }
  }
});

// Log the bot into Discord with your token
client.login(token);
