'use strict';

module.exports = (sequelize, DataTypes) => {
  var UserWoocommerceData = sequelize.define('user_woocommerce_data', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull:false,
    },
    consumerKey: {
      type: DataTypes.STRING,
      allowNull:false,
    },
    consumerSecret: {
      type: DataTypes.STRING,
      allowNull:false,
    },
    storeUrl: {
      type: DataTypes.STRING,
      allowNull:false,
    },
  }, {});

  UserWoocommerceData.associate = function (models){
    UserWoocommerceData.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'user',
    });
  };
  return UserWoocommerceData;
}

