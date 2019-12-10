'use strict';

module.exports = (sequelize, DataTypes) => {
  var Tmpoptin = sequelize.define('tmpoptin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstname: DataTypes.STRING,
    lastname: DataTypes.INTEGER,
    phone: {
      type: DataTypes.STRING,
      unique: 'phone_user_composite',
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: 'phone_user_composite',
    },
    countryId: {
      type: DataTypes.INTEGER,
      unique: 'phone_user_composite',
    },
    misc: DataTypes.STRING,
  }, {});

  // Group.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // Group.belongsTo(User);

  Tmpoptin.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Tmpoptin.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Tmpoptin.belongsTo(models.Country, {
      foreignKey: 'countryId'
    });
  }

  return Tmpoptin;
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