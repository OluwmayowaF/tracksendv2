'use strict';

module.exports = (sequelize, DataTypes) => {
  var Settingsuserbilling = sequelize.define('settingsuserbilling', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: DataTypes.INTEGER,
    settingsnetworkId: DataTypes.INTEGER,
    unit: DataTypes.DOUBLE,
  }, {});

  // SettingsdefaultbillingID.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // SettingsdefaultbillingID.belongsTo(User);

  Settingsuserbilling.associate = function (models) {
    // models.SettingsdefaultbillingID.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Settingsuserbilling.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Settingsuserbilling.belongsTo(models.Settingsnetwork, {
      foreignKey: 'settingsnetworkId'
    });
  }

  return Settingsuserbilling;
}
