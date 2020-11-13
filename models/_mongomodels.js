'use strict';

const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');
// const AutoIncrement = require('mongoose-sequence')(mongoose);
const mongo_username = '';// 'tiwexmong';
const mongo_password = '';//'Tracksend8319#';
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
  misc:         String,
  fullname:     String,
  company:      String,
  city:         String,
  state:        String,
  zip_code:     String,
  count:        Number,
  trip:         String,
  rank:         String,
  loyalty:      String,
  category:     String,
  create_date:  Date,
  signup_ip:    String,
  signup_timestamp:           Date,
  confirmation_ip:            String,
  confirmation_timestamp:     Date,
  
  otherfields:    mongoose.Schema.Types.Mixed     //  remember to add this line: amodel.markModified('otherfield'); after updating this field in code
}, {
  timestamps:     true,
  versionKey:     false,
})
// ContactSchema.plugin(AutoIncrement, {inc_field: 'id'});
ContactSchema.index({ phone: 1, groupId: 1, userId: 1 }, { unique: 1});

const Contact = mongoose.model('contacts', ContactSchema);
Contact.on('index', function (err) {
  console.log('___contact indexing: ' + (err ? 'error: ' + err : 'no errors'));
})

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

GroupSchema.index({ name: 1, userId: 1 }, { unique: 1});

const Group = mongoose.model('groups', GroupSchema);
Group.on('index', function (err) {
  console.log('___group indexing: ' + (err ? 'error: ' + err : 'no errors'));
})

const PerfCampaignSchema = new mongoose.Schema({
  name:           String,
  userId:         {
    type: Number,
    index: true,
  },
  description:    String,
  budget:         Number,
  minbudget:      Number,
  cost:           Number,
  // conditionset:   Array,
  conditionset:   mongoose.Schema.Types.Mixed,
  type:           String,   //  sms | whatsapp
  measure:        String,   //  click | impression
  senderId:       Number,
  shortlinkId:    Number,
  startdate:      Date,
  message:        String,
  status:         mongoose.Schema.Types.Mixed,  //  an object for different types of statuses
  addoptin:       Boolean,
  admincomment:   String,
}, {
  timestamps:     true,
  versionKey:     false,
});
const PerfCampaign = mongoose.model('perfcampaigns', PerfCampaignSchema);

const PerfContactSchema = new mongoose.Schema({
  phone:          String,
  fields:         mongoose.Schema.Types.Mixed,
  usecount:       Number,
  status:         mongoose.Schema.Types.Mixed,  //  an object for different types of statuses ...dnd ['yes' | 'maybe' | 'no'], active [true | false]
  batch:          {
    type: Number,
    index: true,
  },
  cost:           Number,  
  price:          Number,  
}, {
  timestamps:     true,
  versionKey:     false,
});
const PerfContact = mongoose.model('perfcontacts', PerfContactSchema);



const mongmodels = {
  Contact,
  Group,
  PerfCampaign,
  PerfContact,
}

module.exports = mongmodels;
