const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}.`);
        console.log(`${ client.commands.size } Commands Registered.`);
        console.log(`${ client.events.size } Events Registered.`);
        client.user.setActivity('https://www.torn.com/');
    },
};