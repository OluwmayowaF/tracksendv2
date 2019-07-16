'use strict';

module.exports = (sequelize, DataTypes) => {
  const Country = sequelize.define('country', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    abbreviation: DataTypes.STRING,
  })

  Country.associate = function (models) {
    Country.hasMany(models.Contact, {
      foreignKey: 'countryId'
    });
    Country.hasMany(models.Settingsnetwork, {
      foreignKey: 'countryId'
    });
  }
  
  return Country;
}

