'use strict';

module.exports = (sequelize, DataTypes) => {
  var Group = sequelize.define('group', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      unique: 'group_user_composite',
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: 'group_user_composite',
    },
    description: DataTypes.STRING,
    platformtypeId: DataTypes.INTEGER,
    count: DataTypes.INTEGER,
  }, {});

  // Group.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // Group.belongsTo(User);

  Group.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Group.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Group.belongsTo(models.Platformtype, {
      foreignKey: 'platformtypeId'
    });
    Group.hasMany(models.Contact, { 
      foreignKey: 'groupId' 
    });
    /* Group.belongsToMany(models.Contact, { 
      through: models.ContactGroup, 
      foreignKey: 'groupId' 
    }); */
    Group.belongsToMany(models.Campaign, { 
      through: models.CampaignGroup, 
      foreignKey: 'groupId' 
    });
  }

  return Group;
}



/* const Sequelize = require('sequelize');
const db = require('../config/db');
// const Contact = require('./Contact');
const Contact = db.import("./Contact");
const ContactGroup = require('./ContactGroup');

// const ContactGroup = db.define('contact_group');

const Group = db.define('Group', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.STRING
  },
  count: {
    type: Sequelize.INTEGER
  },
})

Group.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });

Group.associate = function (models) {
  // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
  Group.belongsTo(models.User);
  // Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'GroupId' });
}

module.exports = Group; */