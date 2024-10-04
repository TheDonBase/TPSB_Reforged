const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind-users')
        .setDescription('remind users to identify')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    async execute(interaction) {
        // Log command execution
        const commandInfo = {
            commandName: interaction.commandName,
            user: interaction.user.tag,
            timestamp: new Date().toISOString(),
        };

        // Add the command info to the log (limit the array to the last 10 commands)
        interaction.client.commandLog.push(commandInfo); // Assuming client.commandLog is initialized as an empty array
        if (interaction.client.commandLog.length > 10) {
            interaction.client.commandLog.shift(); // Remove the oldest command to keep the array at max 10
        }
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