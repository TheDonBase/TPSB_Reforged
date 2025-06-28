const {SlashCommandBuilder} = require('discord.js');
const Database = require("../../utils/DatabaseHandler");
const Logger = require('../../utils/logger');

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
          {name: 'start', value: 'start'},
          {name: 'stop', value: 'stop'},
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
      if (chainGuard.isActive) return interaction.reply({content: 'Chain guard is already running!', ephemeral: true});

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

      // Skicka till loggkanalen
      const logChannel = await interaction.guild.channels.cache.get('731989414531563603').catch(() => null);
      if (logChannel && logChannel.type === ChannelType.GuildText) {
        logChannel.send(`❌ Chain guard fetch failed twice. Status: ${res.status} ${res.statusText}`);
      }

      // Skicka till interaktionskanal
      if (interaction.channel) {
        interaction.channel.send('❌ Failed to fetch chain data twice. Shutting down chain guard.');
      }

      // Stäng av
      chainGuard.isActive = false;
      if (chainGuard.timeout) clearTimeout(chainGuard.timeout);
      return;
    }

    const data = await res.json();
    const chain = data?.chain;
    Logger.chain("DEBUG - Parsed chain object:", chain);

    if (!chain || chain.current <= 0) {
      chainGuard.remaining = null;
      chainGuard.isActive = false;
      if (chainGuard.timeout) clearTimeout(chainGuard.timeout);
      return interaction.channel.send('⚠️ No active chain detected.');
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