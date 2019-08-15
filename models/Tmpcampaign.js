'use strict';

module.exports = (sequelize, DataTypes) => {
  var Tmpcampaign = sequelize.define('tmpcampaign', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    shortlinkId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    myshorturl: DataTypes.STRING,
    grp: DataTypes.STRING,
    message: DataTypes.STRING,
    schedule: DataTypes.STRING,
    recipients: DataTypes.STRING,
    status: DataTypes.INTEGER,
    skip_dnd: DataTypes.STRING,
    units_used: DataTypes.DOUBLE,
  }, {});

  // Tmpcampaign.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // Tmpcampaign.belongsTo(User);

  Tmpcampaign.associate = function (models) {
    // models.Tmpcampaign.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Tmpcampaign.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Tmpcampaign.belongsTo(models.Sender, {
      foreignKey: 'senderId'
    });
    Tmpcampaign.belongsToMany(models.Group, { 
      through: models.CampaignGroup, 
      foreignKey: 'campaignId' 
    });
    Tmpcampaign.hasMany(models.Message, { 
      foreignKey: 'campaignId' 
    });
  }

  return Tmpcampaign;
}
