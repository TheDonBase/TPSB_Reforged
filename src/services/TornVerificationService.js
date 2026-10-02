const Database = require('../utils/DatabaseHandler');
const Logger = require('../utils/logger');

class TornVerificationService {
    constructor() {
        this.db = new Database();
    }

    async getApiKey() {
        const apiKeyJson = await this.db.getApiKey('peace');

        if (!apiKeyJson) {
            throw new Error('No API key found for faction "peace".');
        }

        let apiKeyArray;

        try {
            apiKeyArray = JSON.parse(apiKeyJson);
        } catch (error) {
            Logger.error(`Failed to parse Torn API key JSON: ${error.message}`);
            throw new Error('Invalid Torn API key configuration.');
        }

        if (!Array.isArray(apiKeyArray) || apiKeyArray.length === 0) {
            throw new Error('No Torn API keys configured.');
        }

        const apiKey = apiKeyArray[0]?.api_key;

        if (!apiKey) {
            throw new Error('Torn API key is missing.');
        }

        // Do NOT log the API key.
        return apiKey;
    }

    validateTornId(tornId) {
        if (!tornId) {
            return {
                valid: false,
                message: 'You must provide a Torn ID.',
            };
        }

        const trimmed = tornId.trim();

        if (!/^\d+$/.test(trimmed)) {
            return {
                valid: false,
                message: 'Your Torn ID must contain numbers only.',
            };
        }

        const parsedId = Number.parseInt(trimmed, 10);

        if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
            return {
                valid: false,
                message: 'Please provide a valid Torn ID.',
            };
        }

        return {
            valid: true,
            tornId: parsedId,
        };
    }

    async fetchTornUser(tornId) {
        const apiKey = await this.getApiKey();

        const url =
            `https://api.torn.com/user/${tornId}` +
            `?selections=profile&key=${encodeURIComponent(apiKey)}`;

        let response;

        try {
            response = await fetch(url);
        } catch (error) {
            Logger.error(`Torn API request failed: ${error.message}`);
            throw new Error('Unable to contact the Torn API.');
        }

        if (!response.ok) {
            Logger.error(
                `Torn API returned HTTP ${response.status} for Torn ID ${tornId}`
            );

            throw new Error('The Torn API returned an unexpected response.');
        }

        let data;

        try {
            data = await response.json();
        } catch (error) {
            Logger.error(`Unable to parse Torn API response: ${error.message}`);
            throw new Error('Invalid response from Torn API.');
        }

        if (data.error) {
            Logger.warn(
                `Torn API error for ${tornId}: ` +
                `${data.error.code} - ${data.error.error}`
            );

            return {
                success: false,
                error: data.error.error ?? 'Unknown Torn API error.',
            };
        }

        return {
            success: true,
            data,
        };
    }

    async verify(tornId, requiredFactionId) {
        const validation = this.validateTornId(tornId);

        if (!validation.valid) {
            return {
                success: false,
                type: 'INVALID_ID',
                message: validation.message,
            };
        }

        const result = await this.fetchTornUser(validation.tornId);

        if (!result.success) {
            return {
                success: false,
                type: 'TORN_API_ERROR',
                message:
                    'We could not find that Torn account. ' +
                    'Please check your Torn ID and try again.',
            };
        }

        const user = result.data;

        if (!user.name) {
            return {
                success: false,
                type: 'INVALID_USER',
                message: 'Unable to retrieve your Torn username.',
            };
        }

        const factionId = Number(user.faction?.faction_id ?? 0);

        if (factionId !== requiredFactionId) {
            return {
                success: false,
                type: 'WRONG_FACTION',
                message: 'You are not currently a member of the required faction.',
                user,
            };
        }

        return {
            success: true,
            tornId: validation.tornId,
            name: user.name,
            factionId,
            user,
        };
    }
}

module.exports = TornVerificationService;