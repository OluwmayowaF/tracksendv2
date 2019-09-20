'use strict';

module.exports = (sequelize, DataTypes) => {
  var Transaction = sequelize.define('transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // amount: DataTypes.DOUBLE,
    userId: DataTypes.INTEGER,
    type: DataTypes.STRING,
    description: DataTypes.STRING,
    ref_id: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    units: DataTypes.DOUBLE,
  }, {});

  Transaction.associate = function (models) {
    Transaction.belongsTo(models.User, {
      foreignKey: 'userId',
    });

  }

  return Transaction;
}
