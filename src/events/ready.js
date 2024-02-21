const { Events } = require('discord.js');
const Logger = require('../utils/Logger');
const { Users } = require('../utils/dbObjects');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        Logger.info(`Ready! Logged in as ${client.user.tag}.`);
        Logger.info(`${client.commands.size} Commands Registered.`);
        Logger.info(`${client.events.size} Events Registered.`);
        client.user.setActivity('https://www.torn.com/');
        const storedBalances = await Users.findAll();
        storedBalances.forEach(b => client.currency.set(b.user_id, b));
    },
};