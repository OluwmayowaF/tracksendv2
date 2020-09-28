'use strict';


module.exports = (sequelize, DataTypes) => {
  var CampaignGroup = sequelize.define('campaign_group', {
    campaignId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    groupId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    groupName: DataTypes.STRING,
  }, {
    timestamps: false
  })
  
  return CampaignGroup;
}

/* const Sequelize = require('sequelize');
const db = require('../config/db');

// const ContactGroup = db.define('contact_group');

const ContactGroup = db.define('contact_group', {
  contactId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  groupId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  }
},{
  // createdAt: false,
  // updatedAt: false,
  timestamps: false,
})

module.exports = ContactGroup; */