const { Users } = require('./dbObjects');

class CurrencyHelper {
  constructor(client) {
    this.client = client;
  }

  async addBalance(id, amount) {
    let user = this.client.currency.get(id);

    if (user) {
      user.balance += Number(amount);
      await user.save();
    } else {
      user = await Users.create({ user_id: id, balance: amount });
      this.client.currency.set(id, user);
    }

    return user;
  }

  getBalance(id) {
    const user = this.client.currency.get(id);
    return user ? user.balance : 0;
  }
}

module.exports = CurrencyHelper;
