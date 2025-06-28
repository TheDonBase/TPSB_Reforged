const { SlashCommandBuilder } = require('discord.js');
const Logger = require('../../utils/logger');
const Database = require("../../utils/DatabaseHandler");

let chainGuard = {
  isActive: false,
  timeout: null,
  remaining: null,
};

const db = new Database();
const chainerRoleId = '1117518078616539197'; // your @chainers role ID

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
    const tornApiKey = await db.getApiKey('peace');
    const factionUrl = `https://api.torn.com/faction/?selections=chains&key=${tornApiKey}`;

    if (action === 'start') {
      if (chainGuard.isActive) return interaction.reply({ content: 'Chain guard is already running!', ephemeral: true });

      chainGuard.isActive = true;
      await interaction.reply('🔒 Chain guard started!');
      startChainGuard(interaction, factionUrl);
    }

    if (action === 'stop') {
      chainGuard.isActive = false;
      if (chainGuard.timeout) clearTimeout(chainGuard.timeout);
      return interaction.reply('🛑 Chain guard stopped.');
    }
  },
};

async function startChainGuard(interaction, factionUrl) {
  try {
    const checkChain = async () => {
      if (!chainGuard.isActive) return;

      const res = await fetch(factionUrl);
      const data = await res.json();
      const chains = data?.chains;
      const chain = chains?.[Object.keys(chains)[0]];

      if (!chain || chain.chain === 0) {
        chainGuard.remaining = null;
        return interaction.channel.send('⚠️ No active chain detected.');
      }

      const remaining = chain.timeout;
      if (!chainGuard.remaining) {
        chainGuard.remaining = remaining;
      }

      if (remaining > 60) {
        // More than 1 min left, wait and check again
        chainGuard.timeout = setTimeout(checkChain, 30000);
      } else {
        // 1 min or less, double check
        const updatedRes = await fetch(factionUrl);
        const updatedData = await updatedRes.json();
        const newRemaining = updatedData?.chains?.[Object.keys(updatedData.chains)[0]]?.timeout || 0;

        if (newRemaining > remaining) {
          chainGuard.remaining = newRemaining;
          chainGuard.timeout = setTimeout(checkChain, 30000);
        } else {
          interaction.channel.send(`<@&${chainerRoleId}> ⚠️ Chain is about to drop! Only **${remaining} seconds** left!`);
          chainGuard.timeout = setTimeout(checkChain, 15000);
        }
      }
    };

    await checkChain();
  } catch (err) {
    console.error('Chain guard error:', err);
    interaction.channel.send('❌ Failed to fetch chain data.');
    chainGuard.isActive = false;
  }
}
