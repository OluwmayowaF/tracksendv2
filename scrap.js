const path = require('path');
const errorHandler = require('errorhandler');
const express = require('express');
const app = express();
app.use('/public', express.static(path.join(__dirname,'static')));
console.log('done');

/* const express = require('express');
const path = require('path');
const app = express();
// const server = require('http').createServer(app);
// const io = require('socket.io').listen(server);

// app.use('/public', express.static(path.join(__dirname, 'static')));
app.use('/public', express.static(path.join(__dirname,'static')));

app.get('/', (reqt, resp) => {
  resp.sendFile(path.join(__dirname, 'static','index.html'));
});

app.listen(3000);
console.log('running...'); */

/* app.use('/public', express.static(path.join(__dirname, 'static')));

app.get('/keke/:a/:b', (reqt, resp) => {
  console.log(reqt.params);
  
  resp.send('yo fro '+reqt.params.a+' to '+reqt.params.b);
})

app.get('/', (reqt, resp) => {
  resp.sendFile(path.join(__dirname, 'static','index.html'));
})

app.listen(3000);





// const tut = require('./sample');
const EventEmitter = require('events');
const http = require('http');
// const express = require('express');
//const socket = require('ws');

const eventEmitter = new EventEmitter();
const server = http.createServer((reqt, resp) => {
  console.log('really!');
  resp.write('ekaabo sori eto yi ooo');
  resp.end();
});

server.listen('3000');


// var app = express();

eventEmitter.on('push', (firstname, surname) => {
  console.log('His full name is '+firstname+' '+surname+'...pusher things');
})

class MyName extends EventEmitter {
  constructor(names) {
    super();

    this.namer = names;
  }

  get named() {
    return this.namer[0] + ' ' + this.namer[1];
  }
}

let oruko = new MyName(['kenny','shog']);
oruko.on('ask', (title)=>{
  console.log('my full name is '+ title + '. ' + oruko.named);
})

oruko.emit('ask', 'Mr'); */

/* eventEmitter.emit('push','kenny','sho');

console.log(tut.ad_(2,3));
console.log(tut.pi_);
console.log(new tut.ao_()); */


/* var mysql = require('mysql');
var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'bduser',
  password        : 'bdpwrd',
  database        : 'boardman'
});

pool.query('SELECT * FROM users', function (error, results, fields) {
  if (error) throw error;
  console.log(fields);
}); */


/* var MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27017/test1', function (err, client) {
  if (err) throw err

  var db = client.db('test1')
  
  db.collection('users').find().toArray(function (err, result) {
    if (err) throw err

    console.log(result)
  })
})

db.users.insertMany(
  [
    {
      id: 3,
      name: 'Olu Mide',
      password: 'olu_mide',
      handle: 'olu_mide',
      email: 'olu_mide@yahoo.ng',
      location: {
        area: 'Ota',
        state: 'Ogun'
      },
      wins: 3,
      losses: 2,
      draws: 1,
      created_at: '2019-03-01 03:09:09',
      updated_at: '0000-00-00 00:00:00'
    },
    {
      id: 4,
      name: 'Luther Popo',
      password: 'luther_popo',
      handle: 'luther_popo',
      email: 'luther_popo@yahoo.ng',
      location: {
        area: 'Festac',
        state: 'Lagos'
      },
      wins: 3,
      losses: 2,
      draws: 1,
      created_at: '2019-02-26 20:48:09',
      updated_at: '0000-00-00 00:00:00'
    },

  ]
)

 */// var rand = require('./my_modules/randomid');
// console.log(rand(7, 'titi'));
