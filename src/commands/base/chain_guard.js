const { SlashCommandBuilder, ChannelType } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');

let chainGuard = {
  isActive: false,
  timeout: null,
  remaining: null,
};

const db = new Database();
const chainerRoleId = '1117518078616539197';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chain-guard')
    .setDescription('Start or stop chain guard')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('start or stop')
        .setRequired(true)
        .addChoices(
          { name: 'start', value: 'start' },
          { name: 'stop', value: 'stop' },
        )
    ),

  async execute(interaction) {
    const action = interaction.options.getString('action');
    const keyResult = await db.getApiKey('war');
    let api_key;

    try {
      const api_key_array = JSON.parse(keyResult);
      if (Array.isArray(api_key_array) && api_key_array.length > 0) {
        api_key = api_key_array[0].api_key;
        Logger.chain(`API Key: ${api_key}`);
      } else {
        Logger.chain("Invalid JSON format or empty array.");
        return interaction.reply("Error: Unable to retrieve API key.");
      }
    } catch (error) {
      Logger.chain(`Error parsing JSON: ${error.message}`);
      return interaction.reply("Error: Unable to parse API key.");
    }

    const tornApiKey = api_key;
    const factionUrl = `https://api.torn.com/faction/?selections=chain&key=${tornApiKey}`;

    if (action === 'start') {
      if (chainGuard.isActive) return interaction.reply({ content: 'Chain guard is already running!', ephemeral: true });

      chainGuard.isActive = true;
      await interaction.reply('🔒 Chain guard started!');
      startChainGuard(interaction, factionUrl, tornApiKey);
    }

    if (action === 'stop') {
      chainGuard.isActive = false;
      if (chainGuard.timeout) clearTimeout(chainGuard.timeout);
      return interaction.reply('🛑 Chain guard stopped.');
    }
  },
};

async function startChainGuard(interaction, factionUrl, tornApiKey) {
  let hasRetried = false;

  const checkChain = async () => {
    if (!chainGuard.isActive) return;

    const res = await fetch(factionUrl);

    if (!res.ok) {
      Logger.chain(`Fetch failed: ${res.status} ${res.statusText}`);

      if (!hasRetried) {
        hasRetried = true;
        Logger.chain("Retrying fetch in 15 seconds...");
        return setTimeout(checkChain, 15000);
      }

      const logChannel = interaction.guild.channels.cache.get('731989414531563603');
      if (logChannel && logChannel.type === ChannelType.GuildText) {
        logChannel.send(`❌ Chain guard fetch failed twice. Status: ${res.status} ${res.statusText}`);
      }

      if (interaction.channel) {
        interaction.channel.send('❌ Failed to fetch chain data twice. Shutting down chain guard.');
      }

      chainGuard.isActive = false;
      if (chainGuard.timeout) clearTimeout(chainGuard.timeout);
      return;
    }

    const data = await res.json();
    const chain = data?.chain;
    Logger.chain("DEBUG - Parsed chain object:", chain);

    if (!chain || chain.current <= 0) {
      // Om cooldown finns, visa rapport
      if (chain.cooldown && chain.cooldown > 0) {
        const reportRes = await fetch(`https://api.torn.com/faction/?selections=chainreport&key=${tornApiKey}`);
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          const report = reportData?.chainreport;

          if (report) {
            const topMembers = Object.values(report.members)
              .sort((a, b) => b.respect - a.respect)
              .slice(0, 3);

            const topUsers = await Promise.all(topMembers.map(async (member) => {
              const userRes = await fetch(`https://api.torn.com/user/${member.userID}?selections=basic&key=${tornApiKey}`);
              if (!userRes.ok) return { name: `ID: ${member.userID}`, respect: member.respect.toFixed(2), attacks: member.attacks };
              const userData = await userRes.json();
              return {
                name: userData.name || `ID: ${member.userID}`,
                respect: member.respect.toFixed(2),
                attacks: member.attacks
              };
            }));

            const embed = {
              title: '📊 Chain Ended - Cooldown Active',
              color: 0x00bfff,
              fields: [
                { name: 'Chain', value: `#${report.chain}`, inline: true },
                { name: 'Respect Gained', value: `${report.respect.toFixed(2)}`, inline: true },
                { name: 'Targets Hit', value: `${report.targets}`, inline: true },
                { name: 'Leaves', value: `${report.leave}`, inline: true },
                { name: 'Mugs', value: `${report.mug}`, inline: true },
                { name: 'Hospitals', value: `${report.hospitalize}`, inline: true },
                { name: 'Assists', value: `${report.assists}`, inline: true },
                { name: 'Best Hit', value: `${report.besthit}`, inline: true },
                {
                  name: '🥇 Top 3 Members',
                  value: topUsers.map((u, i) => `**${i + 1}.** ${u.name} — ${u.respect} respect (${u.attacks} atk)`).join('\n'),
                  inline: false
                }
              ],
              footer: { text: 'Chain Cooldown Active' }
            };

            await interaction.channel.send({ embeds: [embed] });
          }
        }
      }

      chainGuard.remaining = null;
      chainGuard.isActive = false;
      if (chainGuard.timeout) clearTimeout(chainGuard.timeout);
      return;
    }

    const remaining = chain.timeout;
    if (!chainGuard.remaining) {
      chainGuard.remaining = remaining;
    }

    if (remaining > 60) {
      chainGuard.timeout = setTimeout(checkChain, 30000);
    } else {
      const updatedRes = await fetch(factionUrl);
      const updatedData = await updatedRes.json();
      const updatedChain = updatedData?.chain;
      const newRemaining = updatedChain?.timeout || 0;

      if (newRemaining > remaining) {
        chainGuard.remaining = newRemaining;
        chainGuard.timeout = setTimeout(checkChain, 30000);
      } else {
        const endTime = `<t:${updatedChain.end}:R>`;
        interaction.channel.send({
          content: `<@&${chainerRoleId}> ⚠️ **Chain is about to drop!**`,
          embeds: [
            {
              title: `Chain Warning ⚠️`,
              color: 0xffaa00,
              fields: [
                { name: "Current Chain", value: `${updatedChain.current}/${updatedChain.max}`, inline: true },
                { name: "Time Remaining", value: `${newRemaining} seconds`, inline: true },
                { name: "Modifier", value: `${updatedChain.modifier}x`, inline: true },
                { name: "Ends", value: endTime, inline: false },
              ],
              footer: { text: 'Stay sharp!' }
            }
          ]
        });

        chainGuard.timeout = setTimeout(checkChain, 15000);
      }
    }
  };

  try {
    await checkChain();
  } catch (err) {
    Logger.chain('Chain guard error:', err);
    interaction.channel.send('❌ An unexpected error occurred in chain guard.');
    chainGuard.isActive = false;
  }
}
