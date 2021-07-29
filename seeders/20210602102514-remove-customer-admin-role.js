"use strict";
const { Op } = require("sequelize");
const { Role, PermissionAccess, Permission } = require("../models");
const permissionEnums = require("../enums/permissions");

module.exports = {
  up: async () => {
    const adminRole = await Role.findOne({ where: { type: "CUSTOMER_ADMIN" } });
    await PermissionAccess.destroy({
      where: {
        roleId: adminRole.id
      },
      force: true
    });
    await Role.destroy({
      where: { id: adminRole.id },
      force: true
    });
  },

  down: async () => {
    let adminRole = await Role.create({
      name: "Customer Admin",
      type: "CUSTOMER_ADMIN",
      allowedApps: "CUSTOMER"
    });
    return [adminRole];
  }
};
