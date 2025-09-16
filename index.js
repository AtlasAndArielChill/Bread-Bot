const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const http = require("http");

// Keep-alive server
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot is running!");
});

// IMPORTANT: Replace this with the ID of the private channel where you want to receive suggestions.
const SUGGESTIONS_CHANNEL_ID = "YOUR_PRIVATE_CHANNEL_ID_HERE";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites, // Needed for managing permissions
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
                    { name: "/tryouts", value: "Starts the tryout process.", inline: true },
                    { name: "/createchannel", value: "Creates a new channel.", inline: true },
                    { name: "/createcategory", value: "Creates a new category.", inline: true },
                    { name: "/suggestion", value: "Submits a suggestion.", inline: true },
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
                await interaction.editReply({ content: `❌ Failed to send embed: ${error.message}` });
            }
        } else if (commandName === "tryouts") {
            const tryoutsEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle("Tryouts Process")
                .setDescription(
                    "First, we have to do DL (Default Loadout Duel),\n" +
                    "then CL (Custom Loadout Duel),\n" +
                    "and finally Sniper Only Duel."
                )
                .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 4096 }))
                .setImage("https://cdn.discordapp.com/attachments/1327154745076613153/1415369159990317236/Tryouts_Process_1.png?ex=68c2f4c0&is=68c1a340&hm=197ce199aba26fcfc1419b5fb85e95c13356c817723c454ad890528a7364f20b&");

            const button = new ButtonBuilder()
                .setCustomId("agree_to_tryout")
                .setLabel("I agree to tryout")
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(button);

            const sentEmbed = await interaction.reply({
                embeds: [tryoutsEmbed],
                components: [row],
                fetchReply: true
            });
            
            setTimeout(async () => {
                await sentEmbed.delete();
            }, 2000);
        } else if (commandName === "createchannel") {
            const channelName = interaction.options.getString("name");
            const channelToCopy = interaction.options.getChannel("copy_from");

            if (!interaction.guild.members.me.permissions.has("MANAGE_CHANNELS")) {
                return await interaction.reply({ content: "I do not have permission to manage channels.", ephemeral: true });
            }

            await interaction.reply({ content: `Creating channel **${channelName}**...`, ephemeral: true });

            try {
                const options = {
                    name: channelName,
                    type: channelToCopy ? channelToCopy.type : ChannelType.GuildText,
                };
                if (channelToCopy) {
                    options.topic = channelToCopy.topic;
                    options.parent = channelToCopy.parentId;
                    options.permissionOverwrites = channelToCopy.permissionOverwrites.cache;
                }

                await interaction.guild.channels.create(options);
                await interaction.editReply({ content: `✅ Successfully created a new channel named **${channelName}!` });
            } catch (error) {
                console.error("Failed to create channel:", error);
                await interaction.editReply({ content: `❌ Failed to create channel: ${error.message}` });
            }
        } else if (commandName === "createcategory") {
            const categoryName = interaction.options.getString("name");
            const categoryToCopy = interaction.options.getChannel("copy_from");

            if (!interaction.guild.members.me.permissions.has("MANAGE_CHANNELS")) {
                return await interaction.reply({ content: "I do not have permission to manage channels.", ephemeral: true });
            }

            await interaction.reply({ content: `Creating category **${categoryName}**...`, ephemeral: true });

            try {
                const options = {
                    name: categoryName,
                    type: ChannelType.GuildCategory,
                };

                if (categoryToCopy) {
                    options.permissionOverwrites = categoryToCopy.permissionOverwrites.cache;
                }

                await interaction.guild.channels.create(options);
                await interaction.editReply({ content: `✅ Successfully created a new category named **${categoryName}!` });
            } catch (error) {
                console.error("Failed to create category:", error);
                await interaction.editReply({ content: `❌ Failed to create category: ${error.message}` });
            }
        } else if (commandName === "suggestion") {
            const modal = new ModalBuilder()
                .setCustomId("suggestionModal")
                .setTitle("Submit a Suggestion");

            const suggestionInput = new TextInputBuilder()
                .setCustomId("suggestionInput")
                .setLabel("Your Suggestion")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(2000);

            const firstActionRow = new ActionRowBuilder().addComponents(suggestionInput);

            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);
        } else if (commandName === "close") {
            const channelToClose = interaction.options.getChannel("channel");
            const guild = interaction.guild;
            const guildOwnerId = guild.ownerId; // Get the server owner's ID
            const everyoneRole = guild.roles.everyone; // The @everyone role

            // Ensure the bot has permissions
            if (!interaction.guild.members.me.permissions.has("MANAGE_CHANNELS") || !interaction.guild.members.me.permissions.has("MANAGE_PERMISSIONS")) {
                return await interaction.reply({ content: "I do not have the necessary permissions (Manage Channels, Manage Permissions) to close this channel.", ephemeral: true });
            }

            // Check if the user running the command is allowed to close channels
            if (!interaction.member.permissions.has("MANAGE_CHANNELS") && interaction.member.id !== guildOwnerId) {
                return await interaction.reply({ content: "You do not have permission to close channels.", ephemeral: true });
            }

            // Check if the channel is already locked (or permissions are already changed)
            // This is a basic check; a more robust check would involve fetching specific permissions
            const currentEveryonePerms = channelToClose.permissionOverwrites.cache.get(everyoneRole.id);
            if (currentEveryonePerms && currentEveryonePerms.deny.has("SendMessages")) {
                return await interaction.reply({ content: `This channel is already locked.`, ephemeral: true });
            }
            
            // Get the current permissions for `@everyone` to restore them later
            const everyoneOverwrite = channelToClose.permissionOverwrites.cache.get(everyoneRole.id);
            const originalEveryoneSendMessages = everyoneOverwrite ? everyoneOverwrite.allow.has("SendMessages") : true; // Default to true if no overwrite exists

            try {
                // Modify permissions for `@everyone`
                await channelToClose.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false, // Deny sending messages for @everyone
                });

                // Optionally, you can also explicitly allow the server owner and the command runner
                await channelToClose.permissionOverwrites.edit(guildOwnerId, {
                    SendMessages: true, 
                });
                 if (interaction.member.id !== guildOwnerId) { // If command runner isn't the owner
                    await channelToClose.permissionOverwrites.edit(interaction.member.id, {
                        SendMessages: true, 
                    });
                }

                const lockMessage = await interaction.reply({
                    content: `🔒 The channel ${channelToClose} has been locked for 24 hours. Only the server owner and the person who locked it can send messages. I will re-open it automatically.`,
                    fetchReply: true
                });

                // Schedule the channel to be unlocked after 24 hours
                setTimeout(async () => {
                    try {
                        // Restore original permissions for @everyone
                        await channelToClose.permissionOverwrites.edit(everyoneRole, {
                            SendMessages: originalEveryoneSendMessages, // Restore original state
                        });

                        // Optionally remove specific overrides if you added them
                        await channelToClose.permissionOverwrites.edit(guildOwnerId, {
                            SendMessages: null // Removes the overwrite
                        });
                        if (interaction.member.id !== guildOwnerId) {
                            await channelToClose.permissionOverwrites.edit(interaction.member.id, {
                                SendMessages: null // Removes the overwrite
                            });
                        }

                        await channelToClose.send("🔓 The channel has been unlocked. You can now send messages again.");
                        await lockMessage.delete().catch(console.error); // Delete the initial lock message
                        console.log(`Channel ${channelToClose.name} unlocked after 24 hours.`);
                    } catch (error) {
                        console.error(`Error unlocking channel ${channelToClose.name}:`, error);
                        await channelToClose.send(`⚠️ There was an error automatically unlocking this channel. Please contact a server administrator.`);
                    }
                }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

            } catch (error) {
                console.error("Failed to close channel:", error);
                await interaction.reply({ content: `❌ Failed to close the channel: ${error.message}`, ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === "agree_to_tryout") {
            await interaction.deferReply({ ephemeral: true });

            await interaction.channel.send(
                `<@${interaction.user.id}> Thanks for agreeing to the tryout process!`,
            );

            await interaction.deleteReply();
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === "suggestionModal") {
            await interaction.deferReply({ ephemeral: true });

            const suggestion = interaction.fields.getTextInputValue("suggestionInput");
            const ownerChannel = client.channels.cache.get(SUGGESTIONS_CHANNEL_ID);

            if (ownerChannel) {
                const suggestionEmbed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle("New Suggestion")
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(suggestion)
                    .setTimestamp();
                
                await ownerChannel.send({ embeds: [suggestionEmbed] });
                
                await interaction.editReply({
                    content: "✅ Your suggestion has been submitted successfully!",
                });
            } else {
                await interaction.editReply({
                    content: "❌ Something went wrong. The suggestions channel was not found.",
                });
                console.error(`Suggestions channel not found. Check the channel ID: ${SUGGESTIONS_CHANNEL_ID}`);
            }
        }
    }
});

server.listen(3000, () => {
    console.log("Web server is running on port 3000");
});

client.login(process.env.DISCORD_BOT_TOKEN);
