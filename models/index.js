'use strict';

var Sequelize = require('sequelize');

const sequelize = require('../config/db');

// const sequelize = new Sequelize(config.database, config.username, config.password);

const models = {
  User:       sequelize.import('./User'),
  Contact:    sequelize.import('./Contact'),
  Group:      sequelize.import('./Group'),
  ContactGroup: sequelize.import('./ContactGroup'),
  Sender:     sequelize.import('./SenderID'),
  Campaign:   sequelize.import('./Campaign'),
  CampaignGroup: sequelize.import('./CampaignGroup'),
  Shortlink:  sequelize.import('./Shortlink'),
  Message:    sequelize.import('./Message'),
  Settingsnetwork:  sequelize.import('./SettingsNetwork'),
  Settingsuserbilling:  sequelize.import('./SettingsUserBilling'),
  Settingstopuprate:  sequelize.import('./SettingsTopupRate'),
  Topup:      sequelize.import('./Topup'),
  Payment:      sequelize.import('./Payment'),
  Country:    sequelize.import('./Country'),
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;