'use strict';

module.exports = (sequelize, DataTypes) => {
  var Sender = sequelize.define('sender', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    status: DataTypes.INTEGER,
  }, {});

  // SenderID.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // SenderID.belongsTo(User);

  Sender.associate = function (models) {
    // models.SenderID.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Sender.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Sender.hasMany(models.Campaign, {
      foreignKey: 'senderId'
    });
  }

  return Sender;
}
