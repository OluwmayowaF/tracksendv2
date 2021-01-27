'use strict';

// Requiring bcrypt for password hashing. Using the bcryptjs version as 
//the regular bcrypt module sometimes causes errors on Windows machines
var bcrypt = require("bcryptjs");
//
// Creating our User model
//Set it as export because we will need it required on the server
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("user", {
    // The email cannot be null, and must be a proper email before creation
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'unique_user_email',
      validate: {
        isEmail: true
      }
    },
    // The password cannot be null
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    api_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'api_key',
    },
    name:             DataTypes.STRING,
    phone:            DataTypes.STRING,
    business:         DataTypes.STRING,
    balance:          DataTypes.DOUBLE,
    token:            DataTypes.STRING,
    wa_active:        DataTypes.BOOLEAN,
    //Woocommerce Integration Status 
    wc_active:        DataTypes.BOOLEAN,
    wa_instanceid:    DataTypes.STRING,
    wa_instancetoken: DataTypes.STRING,
    wa_instanceurl:   DataTypes.STRING,
    sms_service:      {
      type: DataTypes.STRING,
      defaultValue: 'infobip',
    },
  }, {
    hooks: {
      beforeCreate: function(user) {
        user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
      },
    }
  });
  // Creating a custom method for our User model. 
  //This will check if an unhashed password entered by the 
  //user can be compared to the hashed password stored in our database
  User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };
  // Hooks are automatic methods that run during various phases of the User Model lifecycle
  // In this case, before a User is created, we will automatically hash their password

  User.associate = function (models) {
    User.hasMany(models.Sender, { 
      foreignKey: 'userId' 
    });
    User.hasMany(models.Campaign, { 
      foreignKey: 'userId' 
    });
    User.hasMany(models.Shortlink, { 
      foreignKey: 'userId' 
    });
    User.hasMany(models.Wallet, { 
      foreignKey: 'userId' 
    });
    User.hasMany(models.Tmpoptin, { 
      foreignKey: 'userId' 
    });
    User.hasMany(models.Settingsuserbilling, { 
      foreignKey: 'userId' 
    });
    User.hasMany(models.Customoptin, { 
      foreignKey: 'userId' 
    });
    User.hasMany(models.Customoptinquestion, { 
      foreignKey: 'userId' 
    });
    User.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription',
    })

  }

  return User;
};

//This is a fix by Samaila Philemon Bala in case you want to use ES6
//and the above is not working

//User.beforeCreate(user => {
  //  user.password = bcrypt.hashSync(
    //  user.password,
      //bcrypt.genSaltSync(10),
      //null
    //);
  //});


