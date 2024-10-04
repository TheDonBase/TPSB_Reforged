const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind-users')
        .setDescription('remind users to identify')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    async execute(interaction) {
        // Initialize counters
        let verifiedMembers = 0;
        const unverifiedMembers = [];

        // Define the regex pattern for digits within square brackets
        const numberPattern = /\[\d+\]/; // This matches any digit within square brackets

        // Iterate through guild members
        interaction.guild.members.cache.forEach((member) => {
            if (member.user.bot) {
                return;
            }
            
            // Check if the member's display name contains the specified number pattern
            if (numberPattern.test(member.displayName)) {
                // Member is verified
                verifiedMembers++;
            } else {
                unverifiedMembers.push(member.displayName);
            }
        });

        // Send an embed with the results
        const embed = {
            color: 0x0099ff,
            title: 'Verification Results',
            fields: [
                {
                    name: 'Verified Members',
                    value: `${verifiedMembers} members`,
                },
                {
                    name: 'Unverified Members',
                    value: `${unverifiedMembers.length} members`,
                },
                {
                    name: 'List of Unverified Members',
                    value: unverifiedMembers.join('\n'),
                },
            ],
        };

        await interaction.reply({ embeds: [embed] });
        },
};