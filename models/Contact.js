'use strict';

module.exports = (sequelize, DataTypes) => {
  const Contact = sequelize.define('contact', {
    id: {
      type:       DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstname:    DataTypes.STRING,
    lastname:     DataTypes.STRING,
    phone: {
      type:       DataTypes.STRING,
      unique: 'phone_user_composite',
    },
    userId: {
      type:       DataTypes.INTEGER,
      unique: 'phone_user_composite',
    },
    groupId: {
      type:       DataTypes.INTEGER,
      unique: 'phone_user_composite',
    },
    email:        DataTypes.STRING,
    do_whatsapp:  DataTypes.BOOLEAN,
    status:       DataTypes.INTEGER,
  })

  // Contact.belongsToMany(Group, { through: ContactGroup, foreignKey: 'contactId' });
  // Contact.belongsTo(User);

  Contact.associate = function (models) {
    Contact.belongsTo(models.User, {
      foreignKey: 'userId'
    });
    Contact.belongsTo(models.Country, {
      foreignKey: 'countryId'
    });
    Contact.belongsTo(models.Group, { 
      foreignKey: 'groupId' 
    });
    /* Contact.belongsToMany(models.Group, { 
      through: models.ContactGroup, 
      foreignKey: 'contactId' 
    }); */
    // Contact.belongsToMany(models.Group, { through: ContactGroup, foreignKey: 'contactId' });
  }
  
  return Contact;
}

/* const Sequelize = require('sequelize');
const db = require('../config/db');
const User = require('./User');
const Group = require('./Group');

// const ContactGroup = db.define('contact_group');

const Contact = db.define('Contact', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstname: {
    type: Sequelize.STRING
  },
  lastname: {
    type: Sequelize.STRING
  },
  phone: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.INTEGER
  },
})

// Contact.belongsToMany(Group, { through: 'ContactGroup', foreignKey: 'contactId' });
// Contact.belongsToMany(User, { as: "User", foreignKey: 'userId'});
Contact.associate = function (models) {
  models.Contact.belongsToMany(models.Group, { through: models.ContactGroup, foreignKey: 'contactId' });
  Contact.belongsTo(models.User);
  // Contact.belongsToMany(models.Group, { through: ContactGroup, foreignKey: 'contactId' });
}

module.exports = Contact; */