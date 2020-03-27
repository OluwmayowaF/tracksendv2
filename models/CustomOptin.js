'use strict';

module.exports = (sequelize, DataTypes) => {
  var Customoptin = sequelize.define('customoptin', {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    optin_type: DataTypes.STRING,
    optin_grps: DataTypes.STRING,
    whatsapp_optin_msg_1: DataTypes.STRING,
    whatsapp_optin_msg_2: DataTypes.STRING,
  }, {});

  Customoptin.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Customoptin.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  }

  return Customoptin;
}

