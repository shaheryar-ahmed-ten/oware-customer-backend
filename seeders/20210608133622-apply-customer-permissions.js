'use strict';
const { Op } = require("sequelize");
const { Role, PermissionAccess, Permission } = require('../models')
const permissionEnums = require('../enums/permissions');
const { ROLES } = require('../enums');


module.exports = {
  up: async () => {
    const superAdminRole = await Role.findOne({
      where: {
        type: ROLES.CUSTOMER_SUPER_ADMIN
      }
    });
    const superAdminPermissions = await Permission.findAll({
      where: {
        type: {
          [Op.in]: Object.keys(permissionEnums).filter(type => type.indexOf('_FULL') > -1)
        }
      }
    });
    await PermissionAccess.destroy({
      where: {
        roleId: superAdminRole.id
      },
      force: true
    });
    let permissionAccesses = await PermissionAccess.bulkCreate(superAdminPermissions.map(permission => ({
      roleId: superAdminRole.id,
      permissionId: permission.id,
    })));
    return [permissionAccesses];
  },
  down: async () => {
    const superAdminRole = await Role.findOne({
      where: {
        type: ROLES.CUSTOMER_SUPER_ADMIN
      }
    });
    const permissions = await Permission.findAll({
      where: {
        type: {
          [Op.in]: Object.keys(permissionEnums).filter(type => type.indexOf('_FULL') > -1)
        }
      }
    });
    const deletions = await PermissionAccess.destroy({
      where: {
        permissionId: { [Op.in]: permissions.map(perm => perm.id) },
        roleId: superAdminRole.id
      },
      force: true
    });
  }
};
