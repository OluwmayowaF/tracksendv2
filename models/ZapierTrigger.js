'use strict';

module.exports = (sequelize, DataTypes) => {
  const Zapiertrigger = sequelize.define('zapiertrigger', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    userId: {
      type:   DataTypes.INTEGER,
      unique: 'userId_name_composite',
    },
    name: {
      type:   DataTypes.STRING,
      unique: 'userId_name_composite',
    },
    hookUrl: {
      type:   DataTypes.STRING,
      unique: 'hookurl_composite',
    },
  })

  Zapiertrigger.associate = function (models) {
    Zapiertrigger.belongsTo(models.User, {
      foreignKey: 'userId'
    });
  }
  
  return Zapiertrigger;
}

