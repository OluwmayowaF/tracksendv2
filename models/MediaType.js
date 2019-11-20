'use strict';

module.exports = (sequelize, DataTypes) => {
  var Mediatype = sequelize.define('mediatype', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
  }, {});

  Mediatype.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Mediatype.hasMany(models.Group, {
      foreignKey: 'mediatypeId',
    });
    Mediatype.hasMany(models.Campaign, {
      foreignKey: 'mediatypeId',
    });
    Mediatype.hasMany(models.Tmpcampaign, {
      foreignKey: 'mediatypeId',
    });
    Mediatype.hasMany(models.Message, {
      foreignKey: 'mediatypeId',
    });
  }

  return Mediatype;
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