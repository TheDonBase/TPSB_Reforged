const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../utils/Logger');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const welcomeChannelId = "731431314397593671"; // ID of the welcome channel
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
            try {
                const file = new AttachmentBuilder('./src/images/embed_background.png');
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`Welcome, ${member.user.username}!`)
                    .setDescription('We are excited to have you here.')
                    .setImage('attachment://embed_background.png') // Replace with the URL of the image you want to display in the welcome message
                    .addFields({name: 'Welcome', value: 'We are excited to have you here. Please use the /identify command to get started.'},)
                    .setTimestamp();

                await welcomeChannel.send({embeds: [welcomeEmbed], files: [file]});
            } catch (error) {
                Logger.error(`Error sending welcome message: ${error.message}`);
            }
    },
};