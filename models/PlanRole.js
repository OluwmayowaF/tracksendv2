'use strict';

module.exports = (sequelize, DataTypes) => {
  var PlanRole = sequelize.define('plan_role', {
    planId: {
      type: DataTypes.INTEGER,
    },
    roleId: {
      type: DataTypes.INTEGER,
    }
  },
    {
      timestamps: false
    })

  PlanRole.associate = function(models){
    PlanRole.belongsTo(models.Plan, {foreignKey: 'planId'})
    PlanRole.belongsTo(models.Role, {foreignKey: 'roleId'})

  };
  return PlanRole;
}
