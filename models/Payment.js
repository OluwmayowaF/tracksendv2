'use strict';

module.exports = (sequelize, DataTypes) => {
  var Payment = sequelize.define('payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    paymentref: DataTypes.STRING,
    txid: DataTypes.INTEGER,
    flwref: DataTypes.STRING,
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    amount: DataTypes.DOUBLE,
    currency: DataTypes.STRING,
    channel: DataTypes.STRING,
    isverified: DataTypes.INTEGER,
  }, {});
 
  // SettingstopuprateID.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // SettingstopuprateID.belongsTo(User);

  Payment.associate = function (models) {
    // models.SettingstopuprateID.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Payment.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    Payment.hasOne(models.Topup, {
      foreignKey: 'paymentId',
    });

  }

  return Payment;
}
