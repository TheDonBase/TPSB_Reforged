const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const Canvas = require('canvas');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const welcomeChannelId = "731431314397593671";
        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

        try {
            // skapa canvas baserat på din bakgrundsbild
            const background = await Canvas.loadImage('./src/images/embed_background.png');
            const canvas = Canvas.createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');

            // rita bakgrundsbild
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // hämta profilbild
            const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));

            // rita avatar (centrerad)
            const avatarSize = 128;
            const avatarX = (canvas.width - avatarSize) / 2;
            const avatarY = (canvas.height - avatarSize) / 2 - 50;
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            // rita användarnamn
            ctx.font = 'bold 40px Sans';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(member.user.username, canvas.width / 2, avatarY + avatarSize + 60);

            // skapa attachment
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Welcome, ${member.user.username}!`)
                .setDescription('We are excited to have you here.')
                .setImage('attachment://welcome-image.png')
                .setTimestamp();

            await welcomeChannel.send({ embeds: [welcomeEmbed], files: [attachment] });

        } catch (error) {
            Logger.error(`Error sending welcome message: ${error.message}`);
        }
    },
};
