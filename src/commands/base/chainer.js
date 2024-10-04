const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chainer')
        .setDescription('Toggles the chainer role.'),
    async execute(interaction) {
        const roleId = '1117518078616539197';  // the role ID
        const member = interaction.member;  // the member who used this command
        const role = member.guild.roles.cache.get(roleId);

        if (!role) {
            return interaction.reply(`Role not found.`);
        }

        if (member.roles.cache.get(roleId)) {  // when the member already has the role
            await member.roles.remove(role);
            return interaction.reply({ content: `:broken_heart: You are no longer part of the ${role.name}`, ephemeral: true });
        } else {  // when the member doesn't have the role
            await member.roles.add(role);
            return interaction.reply({ content: `:heart: You are now part of the ${role.name}, Nice work, let the slaughtering begin. ;)`, ephemeral: true });
        }
    },
};