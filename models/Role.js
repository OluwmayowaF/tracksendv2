'use strict';

module.exports = (sequelize, DataTypes) => {
  var Role = sequelize.define('role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull:false,
    },
  }, {});

  Role.associate = function (models){
     Role.belongsToMany(models.Permission, {
        through: models.RolePermission,
        as:"permissions",
        foreignKey: 'roleId'
    });
    Role.hasMany(models.User,
      { as:'users'});
  };
  return Role;
}
