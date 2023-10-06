const config = require('../../config.json');
const mysql = require('mysql');

class Database {
    constructor() {
        this.pool = mysql.createPool(config);
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
                console.error('Error closing the database connection:', err);
            } else {
                console.log('Database connection closed.');
            }
        });
    }
}

module.exports = Database;