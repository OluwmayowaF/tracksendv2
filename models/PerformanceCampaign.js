'use strict';

module.exports = (sequelize, DataTypes) => {
  var PerformanceCampaign = sequelize.define('performancecampaign', {
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
    cost:       DataTypes.DOUBLE,
    platformtypeId: DataTypes.INTEGER,
    condition:  DataTypes.STRING,
    within_days: DataTypes.INTEGER,
    ref_campaign:   {
      type:     DataTypes.STRING,
      allowNull: true
    },
  }, {});

  // PerformanceCampaign.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // PerformanceCampaign.belongsTo(User);

  PerformanceCampaign.associate = function (models) {
    // models.PerformanceCampaign.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    PerformanceCampaign.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    PerformanceCampaign.belongsTo(models.Platformtype, {
      foreignKey: 'platformtypeId'
    });
    PerformanceCampaign.belongsTo(models.Sender, {
      foreignKey: 'senderId'
    });
    PerformanceCampaign.hasMany(models.Message, { 
      foreignKey: 'campaignId' 
    });
  }

  return PerformanceCampaign;
}
