'use strict';
const { Op } = require("sequelize");
const { Role, PermissionAccess, Permission } = require('../models')
const permissionEnums = require('../enums/permissions');

module.exports = {
  up: async () => {
    let roles = await Role.bulkCreate([{
      name: 'Customer Super Admin',
      type: 'CUSTOMER_SUPER_ADMIN'
    }, {
      name: 'Customer Admin',
      type: 'CUSTOMER_ADMIN'
    }]);
    const superAdminRole = roles.find(role => role.type == 'CUSTOMER_SUPER_ADMIN');
    const superAdminPermissions = await Permission.findAll({
      where: {
        type: {
          [Op.in]: Object.keys(permissionEnums).filter(type => type.indexOf('_FULL') > -1)
        }
      }
    });
    let permissionAccesses = await PermissionAccess.bulkCreate(
      superAdminPermissions.map(permission => ({
        roleId: superAdminRole.id,
        permissionId: permission.id,
      })));
    return [roles, permissionAccesses];
  },

  down: async () => {
    const superAdminRole = await Role.findOne({ where: { type: 'CUSTOMER_SUPER_ADMIN' } });
    const adminRole = await Role.findOne({ where: { type: 'CUSTOMER_SUPER_ADMIN' } });
    const permissions = await Permission.findAll({
      where: {
        type: {
          [Op.in]: Object.keys(permissionEnums).filter(type => type.indexOf('_FULL') > -1)
        }
      }
    });
    await PermissionAccess.destroy({
      where: {
        permissionId: { [Op.in]: permissions.map(perm => perm.id) },
        roleId: superAdminRole.id
      },
      force: true
    });
    await Role.destroy({
      where: { id: { [Op.in]: [superAdminRole.id, adminRole.id] } },
      force: true
    });
  }
};
