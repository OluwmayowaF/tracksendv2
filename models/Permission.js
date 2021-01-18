'use strict';

module.exports = (sequelize, DataTypes) => {
  var Permission = sequelize.define('permission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull:false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull:true,
    },
  }, {});

  Permission.associate = function (models){
     Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      as:"roles",
      foreignKey: 'permissionId'
    });
  }


  return Permission;
}
