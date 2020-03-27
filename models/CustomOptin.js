'use strict';

module.exports = (sequelize, DataTypes) => {
  var Customoptin = sequelize.define('customoptin', {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    optin_type: DataTypes.STRING,
    optin_grps: DataTypes.STRING,
    optin_msg1: DataTypes.STRING,
    msg1_channels: DataTypes.STRING,
    optin_msg2: DataTypes.STRING,
    msg2_channels: DataTypes.STRING,
  }, {});

  Customoptin.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Customoptin.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  }

  return Customoptin;
}

