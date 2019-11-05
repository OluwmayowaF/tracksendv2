'use strict';

module.exports = (sequelize, DataTypes) => {
  var Shortlink = sequelize.define('shortlink', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shorturl: {
      type: DataTypes.STRING,
      unique: 'shortlink_shorturl'
    },
    url: DataTypes.STRING,
    // userId: DataTypes.INTEGER,
    clickcount: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
  }, {});

  // Group.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // Group.belongsTo(User);

  Shortlink.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Shortlink.belongsTo(models.User, {
      foreignKey: 'userId',
    });
    Shortlink.hasMany(models.Campaign, { 
      foreignKey: 'shortlinkId',
    });
    Shortlink.hasMany(models.Message, { 
      foreignKey: 'shortlinkId',
    });
  }

  return Shortlink; 
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