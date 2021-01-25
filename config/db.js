const Sequelize = require('sequelize');
const environment = process.env.NODE_ENV;
const stage = require('../config.js')[environment];

const mysql_host = stage.DBMYSQLHOST;
const mysql_user = stage.DBMYSQLUSERNAME;// 'tiwexmong';
const mysql_pwrd = stage.DBMYSQLPASSWORD;//'Tracksend8319#';
const mysql_db   = stage.DBMYSQLDATABASE;


module.exports = new Sequelize(mysql_db, mysql_user, mysql_pwrd, {
  
  host: mysql_host, //'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 20000
  },

  logging: false,
  
});
