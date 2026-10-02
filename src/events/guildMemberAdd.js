const { Events } = require('discord.js');

const verification = require('../config/verification');
const Logger = require('../utils/logger');

module.exports = {
    name: Events.GuildMemberAdd,

    async execute(member) {
        if (member.user.bot) {
            return;
        }

        try {
            const role = member.guild.roles.cache.get(
                verification.roles.unverified
            );

            if (!role) {
                Logger.error(
                    `Unverified role ${verification.roles.unverified} ` +
                    `could not be found in ${member.guild.name}.`
                );

                return;
            }

            await member.roles.add(
                role,
                'New member awaiting Torn verification'
            );

            Logger.info(
                `Added Unverified role to new member ` +
                `${member.user.tag}.`
            );
        } catch (error) {
            Logger.error(
                `Failed to add Unverified role to ` +
                `${member.user.tag}: ${error.stack ?? error.message}`
            );
        }
    },
};