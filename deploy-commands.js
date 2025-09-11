const { SlashCommandBuilder, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TOKEN = process.env.DISCORD_BOT_TOKEN;

const commands = [
    new SlashCommandBuilder()
        .setName("msgserver")
        .setDescription("Sends a message to a specific channel.")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to send the message to.")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("msg")
                .setDescription("The message to send.")
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("promote")
        .setDescription("Removes old roles and adds a new one to a user.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to promote.")
                .setRequired(true),
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("The new role for the user.")
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("createrole")
        .setDescription(
            "Creates a new role with settings copied from an existing role."
        )
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name for the new role.")
                .setRequired(true),
        )
        .addRoleOption((option) =>
            option
                .setName("copy_from")
                .setDescription(
                    "The role to copy permissions, color, etc. from."
                )
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("addrole")
        .setDescription("Adds a role to a user.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to add the role to.")
                .setRequired(true),
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("The role to add.")
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("removerole")
        .setDescription("Removes a role from a user.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to remove the role from.")
                .setRequired(true),
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("The role to remove.")
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("deleterole")
        .setDescription("Deletes a role from the server.")
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("The role to delete.")
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Checks the bot's latency."),
    new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Displays a user's avatar.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to get the avatar of.")
                .setRequired(false),
        ),
    new SlashCommandBuilder()
        .setName("help")
        .setDescription("Lists all available commands."),
    new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bans a user from the server.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to ban.")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("The reason for the ban.")
                .setRequired(false),
        ),
    new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kicks a user from the server.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to kick.")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("The reason for the kick.")
                .setRequired(false),
        ),
    new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warns a user.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user to warn.")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("The reason for the warning.")
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Deletes a number of messages from the channel.")
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The number of messages to delete (1-100).")
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("embed")
        .setDescription("Sends a custom embed message.")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to send the embed to.")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("title")
                .setDescription("The title of the embed.")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("description")
                .setDescription("The description of the embed.")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("color")
                .setDescription("The hex color of the embed (e.g., #FF0000).")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("author_name")
                .setDescription("The name of the author.")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("author_url")
                .setDescription("A URL for the author's link.")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("author_icon_url")
                .setDescription("A URL for the author's icon.")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("thumbnail_url")
                .setDescription("A URL for the embed thumbnail.")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("image_url")
                .setDescription("A URL for the main image.")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("footer_text")
                .setDescription("The text for the footer.")
                .setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("footer_icon_url")
                .setDescription("A URL for the footer's icon.")
                .setRequired(false),
        )
        .addBooleanOption((option) =>
            option
                .setName("timestamp")
                .setDescription("Show the current timestamp in the footer.")
                .setRequired(false),
        ),
    new SlashCommandBuilder()
        .setName("tryouts")
        .setDescription("Starts the tryout process."),
    new SlashCommandBuilder()
        .setName("createchannel")
        .setDescription("Creates a new channel in the server.")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name for the new channel.")
                .setRequired(true),
        )
        .addChannelOption((option) =>
            option
                .setName("copy_from")
                .setDescription("The channel to copy permissions from.")
                .setRequired(false),
        ),
    new SlashCommandBuilder()
        .setName("createcategory")
        .setDescription("Creates a new category in the server.")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name for the new category.")
                .setRequired(true),
        )
        .addChannelOption((option) =>
            option
                .setName("copy_from")
                .setDescription("The category to copy permissions from.")
                .setRequired(false),
        ),
    new SlashCommandBuilder()
        .setName("suggestion")
        .setDescription("Submits a suggestion to the server owner."),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("Started refreshing application (/) commands.");
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
})();
