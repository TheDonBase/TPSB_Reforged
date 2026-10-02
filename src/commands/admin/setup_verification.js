const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ChannelType,
} = require('discord.js');

const verification = require('../../config/verification');
const Logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-verification')
        .setDescription('Create the Torn verification panel.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true,
        });

        try {
            const channel =
                interaction.guild.channels.cache.get(
                    verification.verificationChannelId
                );

            if (!channel) {
                return interaction.editReply(
                    '❌ The configured verification channel could not be found.'
                );
            }

            if (channel.type !== ChannelType.GuildText) {
                return interaction.editReply(
                    '❌ The verification channel must be a text channel.'
                );
            }

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle('Torn Account Verification')
                .setDescription(
                    [
                        '**Welcome to the server!**',
                        '',
                        'Before you can access the rest of the server, ' +
                        'we need to verify that you are a member of our Torn faction.',
                        '',
                        '### How do I find my Torn ID?',
                        '',
                        '1. Open **Torn**.',
                        '2. Go to your **profile**.',
                        '3. Look at the URL in your browser.',
                        '',
                        'It will look something like:',
                        '',
                        '`https://www.torn.com/profiles.php?XID=1234567`',
                        '',
                        'The number after **XID=** is your Torn ID.',
                        '',
                        'In the example above, the Torn ID is:',
                        '',
                        '**1234567**',
                        '',
                        'You can also find it in your profile within the [ ] Brackets next to your name.',
                        'When you are ready, press the button below.',
                    ].join('\n')
                )
                .setFooter({
                    text:
                        'Your faction membership will be checked automatically.',
                });

            const verifyButton = new ButtonBuilder()
                .setCustomId('verify_torn')
                .setLabel('Verify Torn Account')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder()
                .addComponents(verifyButton);

            await channel.send({
                embeds: [embed],
                components: [row],
            });

            Logger.info(
                `${interaction.user.tag} created the verification panel.`
            );

            return interaction.editReply(
                `✅ Verification panel created in ${channel}.`
            );
        } catch (error) {
            Logger.error(
                `Unable to create verification panel: ` +
                `${error.stack ?? error.message}`
            );

            return interaction.editReply(
                '❌ Something went wrong while creating the verification panel.'
            );
        }
    },
};