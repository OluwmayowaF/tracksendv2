'use strict';

module.exports = (sequelize, DataTypes) => {
  var Platformtype = sequelize.define('platformtype', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
  }, {});

  Platformtype.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Platformtype.hasMany(models.Group, {
      foreignKey: 'platformtypeId',
    });
    Platformtype.hasMany(models.Campaign, {
      foreignKey: 'platformtypeId',
    });
    Platformtype.hasMany(models.Tmpcampaign, {
      foreignKey: 'platformtypeId',
    });
    Platformtype.hasMany(models.Message, {
      foreignKey: 'platformtypeId',
    });
  }

  return Platformtype;
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