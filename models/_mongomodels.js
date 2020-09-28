'use strict';

const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');
// const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongo_username = '';
const mongo_password = '';
const mongo_db = 'tracksend';

const mongoconnectionurl = 'mongodb://' + 
                           mongo_username + 
                           (mongo_username ? ':' : '') +
                           mongo_password + 
                           (mongo_password ? '@' : '') +
                            'localhost:27017/' +
                          //  '167.71.89.146:27017/' +
                           mongo_db;
console.log('urlurl is ' + mongoconnectionurl);

mongoose.connect(mongoconnectionurl, {useNewUrlParser: true});
mongoose.set('useFindAndModify', false);
// const sequelize = new Sequelize(config.database, config.username, config.password);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'error in mongo'));
db.once('open', function () {
  console.log('we\'re connected');
})

const ContactSchema = new mongoose.Schema({
  id:             Number,
  firstname:      String,
  lastname:       String,
  phone:          {
    type: String,
    index: true,
  },
  email:          String,
  userId:         {
    type: Number,
    index: true,
  },
  groupId:        {
    type:         ObjectId,
    index:        true,
  },
  // countryId:      Number,
  country:        {
    id:           Number,
    name:         String,
    abbreviation: String,
  },
  do_whatsapp:    {
    type:         Number,
    default:      0,
  },
  do_sms:    {
    type:         Number,
    default:      0,
  },
  smsoptintime:   Date,
  smsoptouttime:  Date,
  status:    {
    type:         Number,
    default:      0,
  },
  misc:           String,
  /* createdAt:      {
    type:         Date,
    default:      Date.now
  },
  updatedAt:      {
    type:         Date,
    default:      Date.now
  }, */
  otherfields:    mongoose.Schema.Types.Mixed     //  remember to add this line: amodel.markModified('otherfield'); after updating this field in code
}, {
  timestamps:     true,
  versionKey:     false,
})
// ContactSchema.plugin(AutoIncrement, {inc_field: 'id'});
const Contact = mongoose.model('contacts', ContactSchema);

const GroupSchema = new mongoose.Schema({
  id:             Number,
  name:           String,
  userId:         {
    type: Number,
    index: true,
  },
  description:    String,
  count:          Number,
  can_optin:      {
    type:         Boolean,
    default:      true
  },
  platformtypId:  {
    type:         Number,
    default:      1
  },
  /* createdAt:      {
    type:         Date,
    default:      Date.now
  },
  updatedAt:      {
    type:         Date,
    default:      Date.now
  }, */
}, {
  timestamps:     true,
  versionKey:     false,
});
// GroupSchema.plugin(AutoIncrement, {inc_field: 'id'});
const Group = mongoose.model('groups', GroupSchema);

const mongmodels = {
  Contact,
  Group
}

module.exports = mongmodels;
