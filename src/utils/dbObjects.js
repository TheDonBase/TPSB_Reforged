const Sequelize = require('sequelize');
const Logger = require('./logger');
const {DataTypes} = require("sequelize");

const sequelize = new Sequelize("mysql://TheDonBasse:x@8R2m9h9@95.98.221.175:3306/tpsb", {
    logging: Logger.debug.bind(Logger)
});

const Users = require('../models/Users.js')(sequelize, DataTypes);
const CurrencyShop = require('../models/CurrencyShop.js')(sequelize, DataTypes);
const UserItems = require('../models/UserItems.js')(sequelize, DataTypes);

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });

Reflect.defineProperty(Users.prototype, 'addItem', {
    value: async item => {
        const userItem = await UserItems.findOne({
            where: { user_id: this.user_id, item_id: item.id },
        });

        if (userItem) {
            userItem.amount += 1;
            return userItem.save();
        }

        return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: 1 });
        },
});

Reflect.defineProperty(Users.prototype, 'getItems', {
    value: () => {
        return UserItems.findAll({
            where: { user_id: this.user_id },
            include: ['item'],
        });
        },
});

module.exports = { Users, CurrencyShop, UserItems };
