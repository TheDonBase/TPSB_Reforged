const {SlashCommandBuilder} = require('discord.js');
const Logger = require('../../utils/logger');
const Database = require("../../utils/DatabaseHandler");

let chainGuard = {
    isActive: false,
    timeout: null,
    remaining: null,
  };

const db = new Database();

const tornApiKey = await db.getApiKey('peace');
const factionUrl = `https://api.torn.com/faction/?selections=chains&key=${tornApiKey}`;
const chainerRoleId = '1117518078616539197'; // e.g., 123456789012345678

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chain-guard')
        .setDescription('Start or stop chain guard')
        .addStringOption('action')
    .setDescription('start or stop')
    .setRequired(true)
    .addStringOption(option =>
        option.setName('action')
          .setDescription('start or stop')
          .setRequired(true)
          .addChoices(
            { name: 'start', value: 'start' },
            { name: 'stop', value: 'stop' },
          )),

    async execute(interaction) {
        const action = interaction.options.getString('action');

        if (action === 'start') {
          if (chainGuard.isActive) return interaction.reply({ content: 'Chain guard is already running!', ephemeral: true });

          chainGuard.isActive = true;
          interaction.reply('🔒 Chain guard started!');

          startChainGuard(interaction);
        }

        if (action === 'stop') {
          chainGuard.isActive = false;
          if (chainGuard.timeout) clearTimeout(chainGuard.timeout);
          interaction.reply('🛑 Chain guard stopped.');
        }
      },
    };

async function startChainGuard(interaction) {
    try {
      const checkChain = async () => {
        if (!chainGuard.isActive) return;

        const res = await axios.get(factionUrl);
        const chain = res.data?.chains?.[Object.keys(res.data.chains)[0]];

        if (!chain || chain.chain === 0) {
          chainGuard.remaining = null;
          return interaction.channel.send('⚠️ No active chain detected.');
        }

        const remaining = chain.timeout;
        if (!chainGuard.remaining) {
          chainGuard.remaining = remaining;
        }

        if (remaining > 60) {
          // Still time left, schedule next check
          chainGuard.timeout = setTimeout(checkChain, 30000);
        } else if (remaining <= 60) {
          // 1 min warning
          const updated = await axios.get(factionUrl);
          const newRemaining = updated.data.chains?.[Object.keys(updated.data.chains)[0]]?.timeout || 0;

          if (newRemaining > remaining) {
            // Chain was continued, reset
            chainGuard.remaining = newRemaining;
            chainGuard.timeout = setTimeout(checkChain, 30000);
          } else {
            // Not continued
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