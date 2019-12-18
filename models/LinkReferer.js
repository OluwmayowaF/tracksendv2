'use strict';

module.exports = (sequelize, DataTypes) => {
  var Linkreferer = sequelize.define('linkreferer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shortlinkId: {
      type: DataTypes.INTEGER,
    },
    referer: DataTypes.STRING,
  }, {});

  Linkreferer.associate = function (models) {
    Linkreferer.belongsTo(models.Shortlink, {
      foreignKey: 'shortlinkId',
    });
  }

  return Linkreferer; 
}
