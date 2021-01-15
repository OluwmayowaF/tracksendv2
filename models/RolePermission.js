'use strict';

module.exports = (sequelize, DataTypes) => {
  var RolePermission = sequelize.define('role_permission', {
    roleId: {
      type: DataTypes.INTEGER,
    },
    permissionId: {
      type: DataTypes.INTEGER,
    }
  },
    {
      timestamps: false
    })

  RolePermission.associate = function(models){
    RolePermission.belongsTo(models.Role, {foreignKey: 'roleId'})
    RolePermission.belongsTo(models.Permission, {foreignKey: 'permissionId'})

  };
  return RolePermission;
}
