require('dotenv').config();  // For loading environment variables from a .env file

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'database_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT, // Can be 'mysql', 'postgres', 'sqlite', etc.
    logging: false,  // Set to true if you want Sequelize to log SQL queries
  },
  production: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'database_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT, // Can be 'mysql', 'postgres', 'sqlite', etc.
    logging: false,
  }
};
