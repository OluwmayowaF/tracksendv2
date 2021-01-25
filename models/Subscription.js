'use strict';

module.exports = (sequelize, DataTypes) => {
  var Subscription = sequelize.define('subscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull:false,
    },
    cycles: {
      type: DataTypes.INTEGER,
      allowNull:false,
    },
    expiry: {
      type: DataTypes.DATE,
      allowNull:false,
    },
  }, {});

  Subscription.associate = function (models){
    Subscription.hasMany(models.User, { 
      foreignKey: 'subscriptionId',
      as: 'user',
    });
    Subscription.belongsTo(models.Plan, {
      foreignKey: 'planId',
      as: 'plan',
    });
  };
  return Subscription;
}
