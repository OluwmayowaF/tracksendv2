/* 

   This module is just to establish
   connection to the MySql database

*/

// var mysql = require('mysql');
const Sequelize = require('sequelize');

module.exports = new Sequelize('tracksend', 'ts_user', 'ts_pwrd', {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
