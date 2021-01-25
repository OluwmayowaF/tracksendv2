'use strict';

module.exports = (sequelize, DataTypes) => {
  var Plan = sequelize.define('plan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull:false,
      unique: 'unique_plan_name',
    },
    description: {
      type: DataTypes.STRING,
      allowNull:true,
    },
    amount: {
      type: DataTypes.DOUBLE,
      allowNull:false,
    },
    period: {
      type: DataTypes.INTEGER,
      allowNull:false,
    },
    creditwallet: {
      type: DataTypes.DOUBLE,
      allowNull:false,
    },
    discountrate: {
      type: DataTypes.DOUBLE,
      allowNull:false,
    },
    discountafter: {
      type: DataTypes.INTEGER,
      allowNull:false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull:false,
    },
  }, {});

  Plan.associate = function (models){
    Plan.hasMany(models.Subscription, { 
      foreignKey: 'planId'
    });
    Plan.belongsToMany(models.Role, {
      through: models.PlanRole,
      as:"roles",
      foreignKey: 'planId'
    });
  };
  return Plan;
}
