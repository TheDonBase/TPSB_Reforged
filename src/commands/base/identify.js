const { SlashCommandBuilder, userMention } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
        const api_key_json = await db.getApiKey('peace'); // Assuming db.getApiKey() returns a JSON string
        let api_key;
        try {
            const api_key_array = JSON.parse(api_key_json);
            if (Array.isArray(api_key_array) && api_key_array.length > 0) {
                const api_key_obj = api_key_array[0];
                api_key = api_key_obj.api_key; // Note the lowercase 'api_key'
                Logger.debug(`API Key: ${api_key}`);
            } else {
                Logger.error("Invalid JSON format or empty array.");
            }
        } catch (error) {
            Logger.error(`Error parsing JSON: ${error.message}`);
        }
        const torn_id = interaction.options.getString('torn_id');
        const parsed_id = Number.parseInt(torn_id);
        const member_role = '731434407466106881';
        const giveaway_role = '731964035506896996';
        if(parsed_id == 1142705) {
            interaction.reply(`No-uuuuh you naughty boy, don't even try it. or it will be the Execution Chamber for you!`);
            return;
        }
        if(Number.isInteger(parsed_id)) {
            try {
                const api_url = `https://api.torn.com/user/${torn_id}?selections=&key=${api_key}`
                const response = await fetch(api_url);
                const data = await response.json();
                let newUsername = `${data.name} [${data.player_id}]`;
                Logger.debug(`Name: ${data.name}`);
                Logger.debug(`Player id: ${data.player_id}`);
                if (data.faction.faction_id == 8322) {
                    if(data.faction.faction_id == 8322) {
                        newUsername = `${data.name} [${data.player_id}] {TPS - Peace}`;
                        if(newUsername.length >= 32) {
                            newUsername = `${data.name} [${data.player_id}]`;
                        }
                    } else {
                        await interaction.reply("You are not part of the faction.");
                    }
                    await interaction.member.setNickname(newUsername);
                    Logger.info("Setting new nickname!");
                    // Check if the member has the roles already
                    if (!interaction.member.roles.cache.has(member_role)) {
                        await interaction.member.roles.add(member_role); // Add member role
                        Logger.info("Added Member Role");
                    }
                    if (!interaction.member.roles.cache.has(giveaway_role)) {
                        await interaction.member.roles.add(giveaway_role); // Add giveaways role
                        Logger.info("Added Giveaway Role");
                    }
                    const query = 'INSERT INTO identified_users (username, torn_id) VALUES (?, ?)';
                    await db.query(query, [data.name, data.player_id]);
                    Logger.info(`Saved ${data.name} to database with player id: ${data.player_id}`);
                    interaction.reply('Nice! You are now verified. Thank you and Welcome ;) Happy Hunting.');
                } else {
                    interaction.reply(`Something went wrong, either you are not in the faction or you should poke ${userMention(232126269284810753)} Cleanup in Aisle 3!`);
                    Logger.error(`Error setting new username for ${interaction.user.tag} User not in faction.`);
                }
            } catch (error) {
                Logger.error(`There was an error: ${error}`);
            }
        } else {
            interaction.reply(`Something went wrong, either you did not provide your ID or you should poke ${userMention(232126269284810753)} Cleanup in Aisle 3!`);
            Logger.error(`Error setting new username for ${interaction.user.tag} With unknown error`);
        }
    }
};