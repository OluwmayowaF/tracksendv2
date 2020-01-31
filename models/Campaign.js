'use strict';

module.exports = (sequelize, DataTypes) => {
  var Campaign = sequelize.define('campaign', {
    id: {
      type:     DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name:       DataTypes.STRING,
    description: DataTypes.STRING,
    shortlinkId: {
      type:     DataTypes.INTEGER,
      allowNull: true
    },
    message:    DataTypes.STRING,
    schedule:   DataTypes.STRING,
    recipients: DataTypes.STRING,
    status:     DataTypes.INTEGER,
    has_utm:    DataTypes.INTEGER,
    units_used: DataTypes.DOUBLE,
    platformtypeId: DataTypes.INTEGER,
  }, {});

  // Campaign.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // Campaign.belongsTo(User);

  Campaign.associate = function (models) {
    // models.Campaign.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Campaign.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Campaign.belongsTo(models.Platformtype, {
      foreignKey: 'platformtypeId'
    });
    Campaign.belongsTo(models.Sender, {
      foreignKey: 'senderId'
    });
    Campaign.belongsToMany(models.Group, { 
      through: models.CampaignGroup, 
      foreignKey: 'campaignId' 
    });
    Campaign.hasMany(models.Message, { 
      foreignKey: 'campaignId' 
    });
  }

  return Campaign;
}
