const { SlashCommandBuilder } = require('discord.js');
const Database = require("../../utils/DatabaseHandler");

let chainGuard = {
  isActive: false,
  timeout: null,
  remaining: null,
};

const db = new Database();
const chainerRoleId = '1117518078616539197'; // byt till din roll-ID

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
    const factionUrl = `https://api.torn.com/faction/?selections=chain&key=${tornApiKey}`;

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
      if (!res.ok) {
        console.error(`Fetch failed: ${res.status} ${res.statusText}`);
        return interaction.channel.send('❌ Failed to fetch chain data.');
      }

      const data = await res.json();
      console.debug("DEBUG - API response:", JSON.stringify(data, null, 2));

      const chain = data?.chain;
      console.debug("DEBUG - Parsed chain object:", chain);

      if (!chain || chain.current <= 0) {
        chainGuard.remaining = null;
        return interaction.channel.send('⚠️ No active chain detected.');
      }

      const remaining = chain.timeout; // seconds left before chain ends
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
          const endTime = `<t:${updatedChain.end}:R>`; // Discord relative time
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

    await checkChain();
  } catch (err) {
    console.error('Chain guard error:', err);
    interaction.channel.send('❌ An error occurred while checking chain status.');
    chainGuard.isActive = false;
  }
}
