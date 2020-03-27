'use strict';

module.exports = (sequelize, DataTypes) => {
  var Customoptinquestion = sequelize.define('customoptinquestion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: DataTypes.INTEGER,
    type: DataTypes.STRING,
    title: DataTypes.STRING,
    option1: DataTypes.STRING,
    option2: DataTypes.STRING,
    option3: DataTypes.STRING,
    option4: DataTypes.STRING,
    option5: DataTypes.STRING,
    polartype: DataTypes.STRING,
  }, {});

  Customoptinquestion.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    Customoptinquestion.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  }

  return Customoptinquestion;
}

