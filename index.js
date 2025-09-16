const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, PermissionsBitField } = require("discord.js");
const http = require("http");

// Web server for keep-alive
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running!");
});

// --- Environment Variables ---
// Make sure to set these in your Render environment variables or .env file
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Required for deploy-commands.js, but good to have here too
const GUILD_ID = process.env.GUILD_ID;   // Required for deploy-commands.js, but good to have here too
const OWNER_ROLE_ID = process.env.OWNER_ROLE_ID; // The role ID for server owners/admins

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // --- Command Handlers ---
        if (commandName === "msgserver") {
            const channel = interaction.options.getChannel("channel");
            const message = interaction.options.getString("msg");

            await interaction.reply({
                content: `Sending message to ${channel.name}...`,
                ephemeral: true,
            });

            try {
                await channel.send(message);
                await interaction.editReply({
                    content: `✅ Successfully sent the message to ${channel.name}!`,
                });
            } catch (error) {
                console.error("Failed to send message:", error);
                await interaction.editReply({
                    content: `❌ Failed to send message: ${error.message}`,
                });
            }
        } else if (commandName === "promote") {
            const member = interaction.options.getMember("user");
            const role = interaction.options.getRole("role");

            if (!interaction.guild.members.me.permissions.has("MANAGE_ROLES")) {
                return await interaction.reply({ content: "I do not have permission to manage roles.", ephemeral: true });
            }

            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({ content: "I cannot manage roles for this user as their highest role is equal to or higher than mine.", ephemeral: true });
            }

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({ content: "I cannot give this role as it is equal to or higher than my highest role.", ephemeral: true });
            }

            await interaction.reply({ content: `Promoting ${member.user.tag}...`, ephemeral: true });

            try {
                const rolesToRemove = member.roles.cache.filter(r => r.id !== interaction.guild.id);
                await member.roles.remove(rolesToRemove);
                await member.roles.add(role);
                await interaction.editReply({ content: `✅ Successfully promoted ${member.user.tag} to **${role.name}**!` });
            } catch (error) {
                console.error("Failed to promote user:", error);
                await interaction.editReply({ content: `❌ Failed to promote user: ${error.message}` });
            }
        } else if (commandName === "createrole") {
            const roleName = interaction.options.getString("name");
            const roleToCopy = interaction.options.getRole("copy_from");

            if (!interaction.guild.members.me.permissions.has("MANAGE_ROLES")) {
                return await interaction.reply({ content: "I do not have permission to manage roles.", ephemeral: true });
            }

            if (roleToCopy.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({ content: `I cannot create a role from **${roleToCopy.name}** because its position is equal to or higher than my highest role.`, ephemeral: true });
            }

            await interaction.reply({ content: `Creating role **${roleName}**...`, ephemeral: true });

            try {
                await interaction.guild.roles.create({
                    name: roleName,
                    color: roleToCopy.color,
                    hoist: roleToCopy.hoist,
                    permissions: roleToCopy.permissions,
                    mentionable: roleToCopy.mentionable,
                });
                await interaction.editReply({ content: `✅ Successfully created a new role named **${roleName}** with the same settings as **${roleToCopy.name}**!` });
            } catch (error) {
                console.error("Failed to create role:", error);
                await interaction.editReply({ content: `❌ Failed to create role: ${error.message}` });
            }
        } else if (commandName === "addrole") {
            const member = interaction.options.getMember("user");
            const role = interaction.options.getRole("role");

            if (!interaction.guild.members.me.permissions.has("MANAGE_ROLES")) {
                return await interaction.reply({ content: "I do not have permission to manage roles.", ephemeral: true });
            }

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({ content: "I cannot add this role as it is equal to or higher than my highest role.", ephemeral: true });
            }

            await interaction.reply({ content: `Adding role to ${member.user.tag}...`, ephemeral: true });

            try {
                await member.roles.add(role);
                await interaction.editReply({ content: `✅ Successfully added the **${role.name}** role to ${member.user.tag}!` });
            } catch (error) {
                console.error("Failed to add role:", error);
                await interaction.editReply({ content: `❌ Failed to add role: ${error.message}` });
            }
        } else if (commandName === "removerole") {
            const member = interaction.options.getMember("user");
            const role = interaction.options.getRole("role");

            if (!interaction.guild.members.me.permissions.has("MANAGE_ROLES")) {
                return await interaction.reply({ content: "I do not have permission to manage roles.", ephemeral: true });
            }

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({ content: "I cannot remove this role as it is equal to or higher than my highest role.", ephemeral: true });
            }

            await interaction.reply({ content: `Removing role from ${member.user.tag}...`, ephemeral: true });

            try {
                await member.roles.remove(role);
                await interaction.editReply({ content: `✅ Successfully removed the **${role.name}** role from ${member.user.tag}!` });
            } catch (error) {
                console.error("Failed to remove role:", error);
                await interaction.editReply({ content: `❌ Failed to remove role: ${error.message}` });
            }
        } else if (commandName === "deleterole") {
            const roleToDelete = interaction.options.getRole("role");

            if (!interaction.guild.members.me.permissions.has("MANAGE_ROLES")) {
                return await interaction.reply({ content: "I do not have permission to manage roles.", ephemeral: true });
            }

            if (roleToDelete.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({ content: `I cannot delete this role because its position is equal to or higher than my highest role.`, ephemeral: true });
            }

            await interaction.reply({ content: `Deleting role **${roleToDelete.name}**...`, ephemeral: true });

            try {
                await roleToDelete.delete();
                await interaction.editReply({ content: `✅ Successfully deleted the role **${roleToDelete.name}!` });
            } catch (error) {
                console.error("Failed to delete role:", error);
                await interaction.editReply({ content: `❌ Failed to delete role: ${error.message}` });
            }
        } else if (commandName === "ping") {
            await interaction.reply({ content: `🏓 Pong! Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms.`, ephemeral: true });
        } else if (commandName === "avatar") {
            const user = interaction.options.getUser("user") || interaction.user;
            const avatarEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`${user.username}'s Avatar`)
                .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }));
            await interaction.reply({ embeds: [avatarEmbed] });
        } else if (commandName === "help") {
            const helpEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle("Bot Commands")
                .setDescription("Here is a list of all available commands:")
                .addFields(
                    { name: "/msgserver", value: "Sends a message to a channel.", inline: true },
                    { name: "/promote", value: "Removes old roles and adds a new one to a user.", inline: true },
                    { name: "/createrole", value: "Creates a new role.", inline: true },
                    { name: "/addrole", value: "Adds a role to a user.", inline: true },
                    { name: "/removerole", value: "Removes a role from a user.", inline: true },
                    { name: "/deleterole", value: "Deletes a role.", inline: true },
                    { name: "/ping", value: "Checks the bot's latency.", inline: true },
                    { name: "/avatar", value: "Displays a user's avatar.", inline: true },
                    { name: "/ban", value: "Bans a user from the server.", inline: true },
                    { name: "/kick", value: "Kicks a user from the server.", inline: true },
                    { name: "/warn", value: "Warns a user.", inline: true },
                    { name: "/purge", value: "Deletes a number of messages.", inline: true },
                    { name: "/embed", value: "Sends a custom embed message.", inline: true },
                    { name: "/close", value: "Locks a channel for 24 hours.", inline: true },
                    { name: "/help", value: "Lists all available commands.", inline: true },
                );
            await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
        } else if (commandName === "ban") {
            const user = interaction.options.getUser("user");
            const member = interaction.guild.members.cache.get(user.id);
            const reason = interaction.options.getString("reason") || "No reason provided";

            if (!interaction.member.permissions.has("BAN_MEMBERS")) {
                return await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
            }

            if (member) {
                if (member.permissions.has("ADMINISTRATOR")) {
                    return await interaction.reply({ content: "I cannot ban an administrator.", ephemeral: true });
                }
                if (!interaction.guild.members.me.permissions.has("BAN_MEMBERS")) {
                    return await interaction.reply({ content: "I do not have permission to ban members.", ephemeral: true });
                }

                try {
                    await member.ban({ reason });
                    await interaction.reply({ content: `✅ Successfully banned **${user.tag}** for reason: ${reason}`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: `❌ Failed to ban **${user.tag}**.`, ephemeral: true });
                }
            } else {
                await interaction.reply({ content: "User not found.", ephemeral: true });
            }
        } else if (commandName === "kick") {
            const user = interaction.options.getUser("user");
            const member = interaction.guild.members.cache.get(user.id);
            const reason = interaction.options.getString("reason") || "No reason provided";

            if (!interaction.member.permissions.has("KICK_MEMBERS")) {
                return await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
            }

            if (member) {
                if (member.permissions.has("ADMINISTRATOR")) {
                    return await interaction.reply({ content: "I cannot kick an administrator.", ephemeral: true });
                }
                if (!interaction.guild.members.me.permissions.has("KICK_MEMBERS")) {
                    return await interaction.reply({ content: "I do not have permission to kick members.", ephemeral: true });
                }

                try {
                    await member.kick({ reason });
                    await interaction.reply({ content: `✅ Successfully kicked **${user.tag}** for reason: ${reason}`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: `❌ Failed to kick **${user.tag}**.`, ephemeral: true });
                }
            } else {
                await interaction.reply({ content: "User not found.", ephemeral: true });
            }
        } else if (commandName === "warn") {
            const user = interaction.options.getUser("user");
            const reason = interaction.options.getString("reason");

            if (!interaction.member.permissions.has("KICK_MEMBERS")) {
                return await interaction.reply({ content: "You do not have permission to warn users.", ephemeral: true });
            }

            const warnEmbed = new EmbedBuilder()
                .setColor(0xffff00)
                .setTitle(`Warning Issued`)
                .addFields(
                    { name: "User", value: user.tag, inline: true },
                    { name: "Moderator", value: interaction.user.tag, inline: true },
                    { name: "Reason", value: reason, inline: false },
                )
                .setTimestamp();

            try {
                await user.send({ content: `You have been warned in the server **${interaction.guild.name}**.`, embeds: [warnEmbed] });
                await interaction.reply({ content: `✅ Successfully warned **${user.tag}**.`, ephemeral: true });
            } catch (error) {
                console.error("Failed to send DM to user:", error);
                await interaction.reply({ content: `❌ Failed to warn user. Could not send a DM.`, ephemeral: true });
            }
        } else if (commandName === "purge") {
            const amount = interaction.options.getInteger("amount");

            if (!interaction.member.permissions.has("MANAGE_MESSAGES")) {
                return await interaction.reply({ content: "You do not have permission to manage messages.", ephemeral: true });
            }

            if (amount <= 0 || amount > 100) {
                return await interaction.reply({ content: "You can only purge between 1 and 100 messages.", ephemeral: true });
            }

            await interaction.reply({ content: `Purging ${amount} messages...`, ephemeral: true });

            try {
                const fetchedMessages = await interaction.channel.messages.fetch({ limit: amount });
                await interaction.channel.bulkDelete(fetchedMessages, true);
                await interaction.editReply({ content: `✅ Successfully purged **${amount}** messages.`, ephemeral: true });
            } catch (error) {
                console.error("Failed to purge messages:", error);
                await interaction.editReply({ content: `❌ Failed to purge messages: ${error.message}` });
            }
        } else if (commandName === "embed") {
            const channel = interaction.options.getChannel("channel");
            const title = interaction.options.getString("title");
            const description = interaction.options.getString("description");
            const color = interaction.options.getString("color");
            const authorName = interaction.options.getString("author_name");
            const authorUrl = interaction.options.getString("author_url");
            const authorIconUrl = interaction.options.getString("author_icon_url");
            const thumbnailUrl = interaction.options.getString("thumbnail_url");
            const imageUrl = interaction.options.getString("image_url");
            const footerText = interaction.options.getString("footer_text");
            const footerIconUrl = interaction.options.getString("footer_icon_url");
            const timestamp = interaction.options.getBoolean("timestamp");

            if (!channel.permissionsFor(interaction.guild.members.me).has(["SendMessages", "EmbedLinks"])) {
                return await interaction.reply({ content: "I do not have permission to send messages and embeds in that channel.", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color.startsWith("#") ? color : `#${color}`);

            if (authorName) {
                embed.setAuthor({ name: authorName, url: authorUrl || null, iconURL: authorIconUrl || null });
            }
            if (thumbnailUrl) {
                embed.setThumbnail(thumbnailUrl);
            }
            if (imageUrl) {
                embed.setImage(imageUrl);
            }
            if (footerText) {
                embed.setFooter({ text: footerText, iconURL: footerIconUrl || null });
            }
            if (timestamp) {
                embed.setTimestamp();
            }

            try {
                await channel.send({ embeds: [embed] });
                await interaction.reply({ content: `✅ Successfully sent the embed to ${channel.name}!`, ephemeral: true });
            } catch (error) {
                console.error("Failed to send embed:", error);
                await interaction.reply({ content: `❌ Failed to send embed: ${error.message}`, ephemeral: true });
            }
        } else if (commandName === "close") {
            const channelToClose = interaction.options.getChannel("channel");
            const guild = interaction.guild;
            const guildOwnerId = guild.ownerId; // This gets the server owner's ID

            // Check for necessary bot permissions
            const botPermissions = interaction.guild.members.me.permissions;
            if (!botPermissions.has(PermissionsBitField.Flags.ManageChannels) || !botPermissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return await interaction.reply({
                    content: "I need 'Manage Channels' and 'Manage Roles' permissions to use this command.",
                    ephemeral: true,
                });
            }

            // Check if the user has permission to use the command
            // Either they have the OWNER_ROLE_ID, or they are the server owner
            const hasOwnerRole = OWNER_ROLE_ID && interaction.member.roles.cache.has(OWNER_ROLE_ID);
            const isServerOwner = interaction.member.id === guildOwnerId;

            if (!hasOwnerRole && !isServerOwner) {
                return await interaction.reply({
                    content: "You do not have permission to use this command. Only server owners or those with the designated owner role can.",
                    ephemeral: true,
                });
            }

            await interaction.reply({
                content: `🔒 Locking channel ${channelToClose}...`,
                ephemeral: true,
            });

            try {
                // Get the current permissions for @everyone for this channel
                const everyoneRole = guild.roles.everyone;
                const currentEveryonePerms = channelToClose.permissionOverwrites.cache.get(everyoneRole.id);
                const originalSendMessages = currentEveryonePerms ? currentEveryonePerms.allow.has(PermissionsBitField.Flags.SendMessages) : true; // Default to true if no overwrite exists

                // Deny send message permission for @everyone
                await channelToClose.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                });

                // Allow send message permission for the server owner
                await channelToClose.permissionOverwrites.edit(guildOwnerId, {
                    SendMessages: true,
                });

                // Optionally, allow the person who ran the command if they are NOT the server owner
                // This prevents the command runner from being locked out if they don't have the owner role
                if (!isServerOwner) {
                    await channelToClose.permissionOverwrites.edit(interaction.user.id, {
                        SendMessages: true,
                    });
                }
                
                // Send a message in the channel indicating it's locked
                const lockMessage = await channelToClose.send(`🔒 This channel has been locked for **24 hours**. Only the server owner and the user who ran this command can send messages. It will be unlocked automatically.`);

                await interaction.editReply({
                    content: `✅ Successfully locked **${channelToClose.name}** for 24 hours.`,
                    ephemeral: true,
                });
                
                // Set a timeout to automatically unlock the channel after 24 hours
                setTimeout(async () => {
                    try {
                        // Restore original @everyone permissions
                        await channelToClose.permissionOverwrites.edit(everyoneRole, {
                             SendMessages: originalSendMessages,
                        });
                        
                        // Remove the specific override for the owner and the command runner (if they weren't the owner)
                        await channelToClose.permissionOverwrites.delete(guildOwnerId);
                        if (!isServerOwner) {
                            await channelToClose.permissionOverwrites.delete(interaction.user.id);
                        }
                        
                        await channelToClose.send("🔓 This channel has been unlocked. You can send messages again.");
                    } catch (err) {
                        console.error("Failed to unlock channel:", err);
                        channelToClose.send("⚠️ There was an error automatically unlocking the channel. Please contact a server administrator to fix this manually.");
                    }
                }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

            } catch (error) {
                console.error("Failed to close channel:", error);
                await interaction.reply({
                    content: `❌ Failed to close the channel: ${error.message}`,
                    ephemeral: true,
                });
            }
        }
    }
});

server.listen(3000, () => {
    console.log("Web server is running on port 3000");
});

// Login to Discord with your client's token
client.login(DISCORD_BOT_TOKEN);
