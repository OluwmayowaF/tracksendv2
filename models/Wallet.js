'use strict';

module.exports = (sequelize, DataTypes) => {
  var Wallet = sequelize.define('wallet', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: DataTypes.DOUBLE,
  }, {});

  // SettingstopuprateID.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // SettingstopuprateID.belongsTo(User);

  Wallet.associate = function (models) {
    // models.SettingstopuprateID.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Wallet.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    Wallet.belongsTo(models.Payment, {
      foreignKey: 'paymentId',
    });

  }

  return Wallet;
}
