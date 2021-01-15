'use strict';

module.exports = (sequelize, DataTypes) => {
  var Settingsnetwork = sequelize.define('settingsnetwork', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name:   DataTypes.STRING,
    prefix: DataTypes.STRING,
    cost:   DataTypes.DOUBLE,
  }, {});

  // SettingsnetworkID.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // SettingsnetworkID.belongsTo(User);

  Settingsnetwork.associate = function (models) {
    // models.SettingsnetworkID.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Settingsnetwork.hasMany(models.Settingsuserbilling, {
      foreignKey: 'settingsnetworkId'
    });
    Settingsnetwork.belongsTo(models.Country, {
      foreignKey: 'countryId'
    });
  }

  return Settingsnetwork;
}
