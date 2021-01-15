'use strict';

module.exports = (sequelize, DataTypes) => {
  var Tmpcampaign = sequelize.define('tmpcampaign', {
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
    myshorturl: DataTypes.STRING,
    grp:        DataTypes.STRING,
    message:    DataTypes.STRING,
    schedule:   DataTypes.STRING,
    recipients: DataTypes.STRING,
    status:     DataTypes.INTEGER,
    skip_dnd:   DataTypes.STRING,
    has_utm:    DataTypes.INTEGER,
    to_optin:   DataTypes.INTEGER,
    to_awoptin: DataTypes.INTEGER,
    add_optout: DataTypes.INTEGER,
    add_optin:  DataTypes.INTEGER,
    cost:       DataTypes.DOUBLE,
    total_cost: DataTypes.DOUBLE,
    platformtypeId: DataTypes.INTEGER,
    within_days:    DataTypes.INTEGER,
    ref_campaign:   DataTypes.STRING,
  }, {});

  // Tmpcampaign.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // Tmpcampaign.belongsTo(User);

  Tmpcampaign.associate = function (models) {
    // models.Tmpcampaign.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Tmpcampaign.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Tmpcampaign.belongsTo(models.Platformtype, {
      foreignKey: 'platformtypeId'
    });
    Tmpcampaign.belongsTo(models.Sender, {
      foreignKey: 'senderId'
    });
    Tmpcampaign.hasMany(models.Message, { 
      foreignKey: 'campaignId' 
    });
  }

  return Tmpcampaign;
}
