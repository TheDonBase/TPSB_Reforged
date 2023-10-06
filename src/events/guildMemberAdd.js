const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const channel_id = "731431314397593671";
        console.log(member);
    },
};