const { SlashCommandBuilder } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crimeexp')
        .setDescription('Get the crimeexp'),
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

        try {
            const crimeExpUrl = `https://api.torn.com/faction/?selections=crimeexp&key=${api_key}`;
            const memberUrl = `https://api.torn.com/faction/?selections=basic&key=${api_key}`;

            const crimeExpResponse = await fetch(crimeExpUrl);
            const crimeExpData = await crimeExpResponse.json();

            const memberResponse = await fetch(memberUrl);
            const memberData = await memberResponse.json();

            if (!crimeExpData || crimeExpData.error) {
                return interaction.reply("Failed to fetch crimeExpData data. Please check your Torn ID.");
            }

            const members = memberData.members;
            const crimeExpIds = crimeExpData.crimeexp;

            const sortedMembers = crimeExpIds.map((id, index) => {
                const member = members[id];
                return {
                    rank: index + 1,
                    name: member ? member.name : "Unknown",
                    id
                };
            });

            // Create and send the image
            const imagePath = await createDataTableImage(sortedMembers);
            await interaction.reply({ files: [imagePath] });

            // Clean up: Delete the image after sending
            fs.unlink(imagePath, (err) => {
                if (err) Logger.error(`Error deleting file: ${err}`);
            });

        } catch (error) {
            Logger.error(`There was an error: ${error}`);
            interaction.reply("An unexpected error occurred. Please try again.");
        }
    }
};

// Function to create a datatable image using node-canvas
async function createDataTableImage(sortedMembers) {
    const width = 600;
    const height = sortedMembers.length * 30 + 50;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background color
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Set font style
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000000';

    // Add table headers
    ctx.fillText('#', 30, 30);
    ctx.fillText('Name', 80, 30);
    ctx.fillText('ID', 350, 30);

    // Add member data
    sortedMembers.forEach((member, index) => {
        const yPosition = 60 + index * 30;
        ctx.fillText(`#${member.rank}`, 30, yPosition);
        ctx.fillText(member.name, 80, yPosition);
        ctx.fillText(`[${member.id}]`, 350, yPosition);
    });

    // Save image to a file
    const imagePath = `/tmp/members_table_${Date.now()}.png`;
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(imagePath, buffer);

    return imagePath;
}
