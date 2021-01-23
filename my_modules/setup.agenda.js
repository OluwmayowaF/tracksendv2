const Agenda = require('agenda');
const environment = process.env.NODE_ENV;
const stage = require('../config.js')[environment];

const mongo_username = stage.DBMONGOUSERNAME;// 'tiwexmong';
const mongo_password = stage.DBMONGOPASSWORD;//'Tracksend8319#';
const mongo_db = stage.DBMONGODATABASE;
const mongo_url = stage.DBMONGOURL;

const connectionString = mongo_url + 
                           mongo_username + 
                           (mongo_username ? ':' : '') +
                           mongo_password + 
                           (mongo_password ? '@' : '') +
                           mongo_db;
console.log('agenda_db:'+ connectionString)
module.exports = new Agenda({
    db: {address: connectionString, collection: 'tracksendJobSchedulers'},
    processEvery: '30 seconds'
});

