'use strict';

module.exports = (sequelize, DataTypes) => {
  var Sender = sequelize.define('sender', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true 
    },
    name: {
      type: DataTypes.STRING,
      unique: 'sender_user_composite',
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: 'sender_user_composite',
    },
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
