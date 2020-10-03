'use strict';

module.exports = (sequelize, DataTypes) => {
  var Optout = sequelize.define('optout', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    contactId: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    platform: DataTypes.STRING,
  }, {});

  Optout.associate = function (models) {
    Optout.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    /* Optout.belongsTo(models.Contact, {
      foreignKey: 'contactId',
    }); */
  }

  return Optout; 
}
