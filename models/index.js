'use strict';

var Sequelize = require('sequelize');

const sequelize = require('../config/cfg/db');

// const sequelize = new Sequelize(config.database, config.username, config.password);

const models = {
  User:         sequelize.import('./User'),
  Contact:      sequelize.import('./Contact'),
  Group:        sequelize.import('./Group'),
  ContactGroup: sequelize.import('./ContactGroup'),
  Sender:       sequelize.import('./SenderID'),
  Tmpcampaign:  sequelize.import('./Tmpcampaign'), 
  Campaign:     sequelize.import('./Campaign'),
  CampaignGroup: sequelize.import('./CampaignGroup'),
  Shortlink:    sequelize.import('./ShortLink'),
  Linkreferer:  sequelize.import('./LinkReferer'),
  Optout:       sequelize.import('./Optout'),
  Message:      sequelize.import('./Message'),
  Platformtype: sequelize.import('./PlatformType'),
  Customoptin:  sequelize.import('./CustomOptin'),
  Customoptinquestion:    sequelize.import('./CustomOptinQuestion'),
  Customcontactresponse:  sequelize.import('./CustomContactResponse'),
  Settingsnetwork:        sequelize.import('./SettingsNetwork'),
  Settingsuserbilling:    sequelize.import('./SettingsUserBilling'),
  Settingstopuprate:      sequelize.import('./SettingsTopupRate'),
  Topup:        sequelize.import('./Topup'),
  Transaction:  sequelize.import('./Transaction'),
  Tmpoptin:     sequelize.import('./Tmpoptin'),
  Payment:      sequelize.import('./Payment'),
  Country:      sequelize.import('./Country'),
  Zapiertrigger:          sequelize.import('./ZapierTrigger'),
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;