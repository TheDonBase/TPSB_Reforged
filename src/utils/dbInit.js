const { Sequelize } = require('sequelize');
const config = require('../config/config.js'); // Import the config
const environment = process.env.NODE_ENV || 'development'; // Default to 'development' if NODE_ENV is not set
const dbConfig = config[environment];
const Logger = require('../utils/logger.js');
let sequelize;

Logger.info(t)
try {
    Logger.info('Attempting to create Sequilize...')
    // Initialize the Sequelize instance with the appropriate config
    sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      port: 3306,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,  // Disable logging if set to false
    });
  
    Logger.log('Attempting to connect to the database...');
  
    // Test the database connection
    sequelize.authenticate().then(() => {
      console.log('Connection has been established successfully.');
    }).catch(err => {
      console.error('Unable to connect to the database:', err);
    });
  
  } catch (error) {
    console.error('Sequelize initialization failed:', error);
  }

const CurrencyShop = require('../models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);
require('../models/Users.js')(sequelize, Sequelize.DataTypes);
require('../models/UserItems.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
    const shop = [
        await CurrencyShop.upsert({name: 'Xanax', cost: 5000}),
        await CurrencyShop.upsert({name: 'Drug Pack', cost: 15000}),
        await CurrencyShop.upsert({name: 'Donator Pack', cost: 25000}),
        ];

    await Promise.all(shop);
    console.log('Database synced');

    sequelize.close();
}).catch(console.error);