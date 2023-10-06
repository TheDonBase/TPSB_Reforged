const { SlashCommandBuilder, userMention } = require('discord.js');
const Database = require("../../utils/database_handler");

module.exports = {
    data: new SlashCommandBuilder()
		.setName('identify')
		.setDescription('identify yourself.')
        .addStringOption(option =>
        option
        .setName('torn_id')
        .setDescription('What is your torn id?')
        .setRequired(true)),
    async execute(interaction) {
        const db = new Database(); // Assuming you have a method to query your database
        const api_key = "Hk5BCj2Icl7hZPRM";
        const torn_id = interaction.options.getString('torn_id');
        const api_url = `https://api.torn.com/user/${torn_id}?selections=&key=${api_key}`

        const response = await fetch(api_url);
        const data = await response.json();
        const newUsername = `${data.name} [${data.player_id}]`;
        console.log(data);
        if (data.faction.faction_id == 8322 || data.faction.faction_id == 19249) {
            await interaction.member.setNickname(newUsername);
            console.log("Setting new nickname!");
            // Check if the member has the roles already
            if (!interaction.member.roles.cache.has('731434407466106881')) {
                await interaction.member.roles.add('731434407466106881'); // Add member role
                console.log("Added Member Role");
            }
            if (!interaction.member.roles.cache.has('731964035506896996')) {
                await interaction.member.roles.add('731964035506896996'); // Add giveaways role
                console.log("Added Giveaway Role");
            }

            interaction.reply('Changed your nickname and id, you are now verified!');
        } else {
            interaction.reply(`Something went wrong, either you are not in the faction or you should poke ${userMention(232126269284810753)} Cleanup in Aisle 3!`);
            console.log(interaction);
        }
    }
};