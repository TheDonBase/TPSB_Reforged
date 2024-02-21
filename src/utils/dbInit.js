const Sequelize = require("sequelize");
const config = require('./seq_config.json');

const sequelize = new Sequelize(config.production);

const CurrencyShop = require('../models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);
require('../models/Users.js')(sequelize, Sequelize.DataTypes);
require('../models/UserItems.js')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
    const shop = [
        await CurrencyShop.upsert({name: 'Tea', cost: 1}),
        await CurrencyShop.upsert({name: 'Coffee', cost: 2}),
        await CurrencyShop.upsert({name: 'Cake', cost: 5}),
        ];

    await Promise.all(shop);
    console.log('Database synced');

    sequelize.close();
}).catch(console.error);