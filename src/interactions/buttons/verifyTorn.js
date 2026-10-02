const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require('discord.js');

module.exports = {
    customId: 'verify_torn',

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('verify_torn_modal')
            .setTitle('Torn Account Verification');

        const tornIdInput = new TextInputBuilder()
            .setCustomId('torn_id')
            .setLabel('What is your Torn ID?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Example: 1234567')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(10);

        const row = new ActionRowBuilder().addComponents(tornIdInput);

        modal.addComponents(row);

        await interaction.showModal(modal);
    },
};