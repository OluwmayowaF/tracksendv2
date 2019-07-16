'use strict';

module.exports = (sequelize, DataTypes) => {
  var Topup = sequelize.define('topup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: DataTypes.DOUBLE,
    units: DataTypes.DOUBLE,
  }, {});

  // SettingstopuprateID.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // SettingstopuprateID.belongsTo(User);

  Topup.associate = function (models) {
    // models.SettingstopuprateID.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Topup.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    Topup.belongsTo(models.Settingstopuprate, {
      foreignKey: 'settingstopuprateId',
    });
    Topup.belongsTo(models.Payment, {
      foreignKey: 'paymentId',
    });

  }

  return Topup;
}
