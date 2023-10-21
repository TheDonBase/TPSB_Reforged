const config = require('../../config.json');
const mysql = require('mysql');
const Logger = require('./logger');

class Database {
    constructor() {
        this.pool = mysql.createPool(config);
    }

    async checkUser(tornId) {
        try {
            const sql = 'SELECT * FROM identified_users WHERE torn_id = ?';
            const values = [tornId];
            const rows = await this.query(sql, values);

            // If a user with the given tornId is found, return true. Otherwise, return false.
            return rows.length > 0;
        } catch (error) {
            // Handle database errors here
            Logger.error(`Error checking user: ${error}`);
            throw error;
        }
    }

    async getApiKey() {
        try {
            Logger.info("Retreiving API Key.");
            const sql = "SELECT api_key from api_keys WHERE username = 'thedonbase'";
            let result = await this.query(sql);
            Logger.info(`Retrieved api key: ${JSON.stringify(result)}`);
            return JSON.stringify(result);
        } catch (error) {
            Logger.error(`Error retrieving API Key: ${error}`);
            throw error;
        }
    }

    async query(sql, values) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    return reject(err);
                }
                connection.query(sql, values, (error, results, fields) => {
                    connection.release();
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            });
        });
    }

    async close() {
        this.pool.end((err) => {
            if (err) {
                Logger.error('Error closing the database connection:', err);
            } else {
                Logger.info('Database connection closed.');
            }
        });
    }
}

module.exports = Database;