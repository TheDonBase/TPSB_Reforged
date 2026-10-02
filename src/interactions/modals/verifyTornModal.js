const {
    EmbedBuilder,
    userMention,
} = require('discord.js');

const TornVerificationService =
    require('../../services/TornVerificationService');

const Logger = require('../../utils/logger');
const verification = require('../../config/verification');

module.exports = {
    customId: 'verify_torn_modal',

    async execute(interaction) {
        await interaction.deferReply({
            ephemeral: true,
        });

        if (interaction.user.bot) {
            return interaction.editReply({
                content: 'Bots are not allowed to verify.',
            });
        }

        const tornIdInput = interaction.fields.getTextInputValue('torn_id');

        const service = new TornVerificationService();

        try {
            /*
             * -----------------------------------------
             * Check if already verified
             * -----------------------------------------
             */

            const alreadyVerified =
                interaction.member.roles.cache.has(
                    verification.roles.member
                );

            if (alreadyVerified) {
                return interaction.editReply({
                    content:
                        'You already have the Member role and appear to be verified.',
                });
            }

            /*
             * -----------------------------------------
             * Validate Torn ID before API request
             * -----------------------------------------
             */

            const validation = service.validateTornId(tornIdInput);

            if (!validation.valid) {
                return interaction.editReply({
                    content: `❌ ${validation.message}`,
                });
            }

            const tornId = validation.tornId;

            /*
             * -----------------------------------------
             * Blocked IDs
             * -----------------------------------------
             */

            if (verification.blockedTornIds.includes(tornId)) {
                Logger.warn(
                    `${interaction.user.tag} attempted to verify ` +
                    `using blocked Torn ID ${tornId}.`
                );

                return interaction.editReply({
                    content:
                        'No-uuuuh you naughty boy, don\'t even try it. ' +
                        'Or it will be the Execution Chamber for you!',
                });
            }

            /*
             * -----------------------------------------
             * Verify against Torn
             * -----------------------------------------
             */

            const result = await service.verify(
                tornIdInput,
                verification.factionId
            );

            if (!result.success) {
                if (result.type === 'WRONG_FACTION') {
                    return interaction.editReply({
                        content:
                            '❌ You are not part of the required faction.\n\n' +
                            `Please poke ${userMention(
                                verification.factionContactDiscordId
                            )} — Cleanup in Aisle 3!`,
                    });
                }

                return interaction.editReply({
                    content: `❌ ${result.message}`,
                });
            }

            /*
             * -----------------------------------------
             * Build nickname
             * -----------------------------------------
             */

            const newNickname =
                `${result.name} [${result.tornId}]`;

            /*
             * Discord nicknames have a maximum length.
             */

            if (newNickname.length > 32) {
                return interaction.editReply({
                    content:
                        '❌ Your Torn username is too long to create the ' +
                        'required Discord nickname automatically. ' +
                        `Please contact ${userMention(
                            verification.factionContactDiscordId
                        )}.`,
                });
            }

            /*
             * -----------------------------------------
             * Change nickname
             * -----------------------------------------
             */

            try {
                await interaction.member.setNickname(
                    newNickname,
                    `Torn verification: ${result.tornId}`
                );

                Logger.info(
                    `Changed nickname for ${interaction.user.tag} ` +
                    `to ${newNickname}.`
                );
            } catch (error) {
                Logger.error(
                    `Unable to change nickname for ` +
                    `${interaction.user.tag}: ${error.message}`
                );

                return interaction.editReply({
                    content:
                        '❌ Your Torn account was verified, but I could not ' +
                        'change your Discord nickname.\n\n' +
                        'Please make sure my bot role is above your current ' +
                        'roles, or contact an administrator.',
                });
            }

            /*
             * -----------------------------------------
             * Add Member role
             * -----------------------------------------
             */

            if (
                !interaction.member.roles.cache.has(
                    verification.roles.member
                )
            ) {
                await interaction.member.roles.add(
                    verification.roles.member,
                    `Verified Torn account ${result.tornId}`
                );

                Logger.info(
                    `Added Member role to ${interaction.user.tag}.`
                );
            }

            /*
             * -----------------------------------------
             * Add Giveaway role
             * -----------------------------------------
             */

            if (
                !interaction.member.roles.cache.has(
                    verification.roles.giveaway
                )
            ) {
                await interaction.member.roles.add(
                    verification.roles.giveaway,
                    `Verified Torn account ${result.tornId}`
                );

                Logger.info(
                    `Added Giveaway role to ${interaction.user.tag}.`
                );
            }

            /*
             * -----------------------------------------
             * Remove Unverified
             * -----------------------------------------
             */

            if (
                verification.roles.unverified &&
                interaction.member.roles.cache.has(
                    verification.roles.unverified
                )
            ) {
                await interaction.member.roles.remove(
                    verification.roles.unverified,
                    `Successfully verified Torn account ${result.tornId}`
                );

                Logger.info(
                    `Removed Unverified role from ${interaction.user.tag}.`
                );
            }

            /*
             * -----------------------------------------
             * Success response
             * -----------------------------------------
             */

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('Verification Successful')
                .setDescription(
                    'Nice! Your Torn account has been verified successfully.'
                )
                .addFields(
                    {
                        name: 'Torn Username',
                        value: result.name,
                        inline: true,
                    },
                    {
                        name: 'Torn ID',
                        value: result.tornId.toString(),
                        inline: true,
                    },
                    {
                        name: 'Discord Nickname',
                        value: newNickname,
                        inline: false,
                    }
                )
                .setFooter({
                    text: 'Welcome! Happy Hunting.',
                })
                .setTimestamp();

            Logger.info(
                `${interaction.user.tag} successfully verified ` +
                `as ${result.name} [${result.tornId}].`
            );

            return interaction.editReply({
                embeds: [embed],
            });
        } catch (error) {
            Logger.error(
                `Verification failed for ${interaction.user.tag}: ` +
                `${error.stack ?? error.message}`
            );

            return interaction.editReply({
                content:
                    '❌ An unexpected error occurred while verifying your ' +
                    'account. Please try again later.',
            });
        }
    },
};