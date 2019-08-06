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


// var names = ['mike', 'jane', 'peter'];
var names = ['mike'];
console.log('black');

var fn = function doThings(name) {
  return new Promise((resolve) => {
    console.log('blue');

    var char = name.substr(1);
    getNum(char);
    console.log('violet');

    function getNum(ch) {
      console.log('green');

      fetch('fetchfrom.url')
      .then(response => {
        console.log('orange');
        
        return response.json();
      }).then(n => {

        if(n === 2) {
          console.log('red1');

          fetch('fetchfrom.url')
          .then(response => {
            console.log('yellow');
            
            return response.json();
          }).then(color => {
            if(color === 2) {
              console.log('red2');
              
              resolve(5);
            }
            else {
              console.log('brown2');
              
              resolve(10);
            }
          });
          console.log('lilac');

        } else {
          console.log('brown1');
          
          resolve(20);
        }
        
      });
    }

  })


}

var actions = names.map(fn)
console.log('grey');

Promise.all([actions])
.then(() => {
  console.log('done');
})






/* 
{"bulkId":"CMPGN-45-3","messages":[{"from":"FROM","destinations":[{"to":"2348022334422","messageId":245},{"to":"2348022334423","messageId":246}],"text":"Hello ... ssdsdds","sendAt":null,"flash":false,"intermediateReport":true,"notifyUrl":"https://tracksend/sms/campaign/notify","notifyContentType":"application/json","validityPeriod":1440}],"tracking":{"track":"SMS","type":"Dr._Hayden_Wilderman_Jr."}}
Status code: 200; Message: {"bulkId":"CMPGN-45-1","messages":[{"to":"2348054433221","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"239"},{"to":"2348033252617","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"240"},{"to":"2348022334455","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"241"}]}
Status code: 200; Message: {"bulkId":"CMPGN-45-2","messages":[{"to":"2348032334457","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"242"},{"to":"2348022334458","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"243"},{"to":"2348022334459","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"244"}]}
Status code: 200; Message: {"bulkId":"CMPGN-45-3","messages":[{"to":"2348022334422","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"245"},{"to":"2348022334423","status":{"groupId":1,"groupName":"PENDING","id":26,"name":"PENDING_ACCEPTED","description":"Message sent to next instance"},"messageId":"246"}]} */