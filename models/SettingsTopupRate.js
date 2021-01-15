'use strict';

module.exports = (sequelize, DataTypes) => {
  var Settingstopuprate = sequelize.define('settingstopuprate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: DataTypes.DOUBLE,
    lowerlimit: DataTypes.DOUBLE,
    upperlimit: DataTypes.DOUBLE,
  }, {});

  // SettingstopuprateID.belongsToMany(Contact, { through: { model: ContactGroup, unique: false }, foreignKey: 'groupId' });
  // SettingstopuprateID.belongsTo(User);

  Settingstopuprate.associate = function (models) {
    // models.SettingstopuprateID.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    /* Settingstopuprate.hasMany(models.Wallet, {
      foreignKey: 'settingstopuprateId'
    }); */
  }

  return Settingstopuprate;
}
