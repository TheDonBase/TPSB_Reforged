const Sequelize = require("sequelize");
const config = require('./seq_config.json');

const sequelize = new Sequelize(config.production);

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