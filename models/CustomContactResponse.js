'use strict';

module.exports = (sequelize, DataTypes) => {
  var Customcontactresponse = sequelize.define('customcontactresponse', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contactId: DataTypes.STRING,
    customoptinquestionId: DataTypes.INTEGER,
    response: DataTypes.STRING,
  }, {});

  Customcontactresponse.associate = function (models) {
    // models.Group.belongsToMany(models.Contact, { through: models.ContactGroup, foreignKey: 'groupId' });
    /* Customcontactresponse.belongsTo(models.Contact, {
      foreignKey: 'contactId',
    }); */
    Customcontactresponse.belongsTo(models.Customoptinquestion, {
      foreignKey: 'customoptinquestionId',
    });
  }

  return Customcontactresponse;
}

