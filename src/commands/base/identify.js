const { SlashCommandBuilder, userMention } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('identify')
        .setDescription('Identify yourself.')
        .addStringOption(option =>
            option
                .setName('torn_id')
                .setDescription('What is your torn id?')
                .setRequired(true)
        ),
    async execute(interaction) {
        const db = new Database();
        const api_key_json = await db.getApiKey('peace');

        if (!api_key_json) {
            Logger.error("No API key found for the specified faction.");
            return interaction.reply("Error: Unable to retrieve API key.");
        }

        let api_key;

        try {
            const api_key_array = JSON.parse(api_key_json);
            if (Array.isArray(api_key_array) && api_key_array.length > 0) {
                api_key = api_key_array[0].api_key;
                Logger.debug(`API Key: ${api_key}`);
            } else {
                Logger.error("Invalid JSON format or empty array.");
                return interaction.reply("Error: Unable to retrieve API key.");
            }
        } catch (error) {
            Logger.error(`Error parsing JSON: ${error.message}`);
            return interaction.reply("Error: Unable to parse API key.");
        }

        const torn_id = interaction.options.getString('torn_id');
        const parsed_id = Number.parseInt(torn_id);
        const member_role = '731434407466106881';
        const giveaway_role = '731964035506896996';

        // Check for bot and role requirements
        if (interaction.user.bot) {
            return interaction.reply("Bots are not allowed to identify.");
        }

        const hasMemberRole = interaction.member.roles.cache.has(member_role);
        const hasGiveawayRole = interaction.member.roles.cache.has(giveaway_role);

        if (!hasMemberRole) {
            await interaction.member.roles.add(member_role);
            Logger.info("Added Member Role");
        }

        if (!hasGiveawayRole) {
            await interaction.member.roles.add(giveaway_role);
            Logger.info("Added Giveaway Role");
        }

        // Check if username contains digits
        const newUsername = `${interaction.user.username} [${parsed_id}]`;
        if (/\d/.test(interaction.user.username)) {
            return interaction.reply("Your username makes it seem like you are already identified, what are you trying to achieve?");
        }

        if (parsed_id === 1142705) {
            return interaction.reply("No-uuuuh you naughty boy, don't even try it. Or it will be the Execution Chamber for you!");
        }

        if (!Number.isInteger(parsed_id)) {
            return interaction.reply("Please provide a valid Torn ID.");
        }

        try {
            const api_url = `https://api.torn.com/user/${torn_id}?selections=&key=${api_key}`;
            const response = await fetch(api_url);
            const data = await response.json();

            if (!data || data.error) {
                return interaction.reply("Failed to fetch user data. Please check your Torn ID.");
            }

            if (data.faction.faction_id !== 8322) {
                return interaction.reply(`Something went wrong, you are not part of the required faction. Please poke ${userMention(232126269284810753)} Cleanup in Aisle 3!`);
            }

            // Update the nickname
            await interaction.member.setNickname(newUsername);
            Logger.info("Setting new nickname!");

            const query = 'INSERT INTO identified_users (username, torn_id) VALUES (?, ?)';
            await db.query(query, [data.name, data.player_id]);
            Logger.info(`Saved ${data.name} to database with player id: ${data.player_id}`);
            interaction.reply('Nice! You are now verified. Thank you and Welcome ;) Happy Hunting.');
        } catch (error) {
            Logger.error(`There was an error: ${error}`);
            interaction.reply("An unexpected error occurred. Please try again.");
        }
    }
};
