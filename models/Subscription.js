const Sequelize = require('sequelize');
const db = require('../config/db');

const Contact = db.define('contact', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  },
  phone: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  },
  business: {
    type: Sequelize.STRING
  },
})

module.exports = Contact;