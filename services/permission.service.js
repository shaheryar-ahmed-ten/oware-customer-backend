const permissions = require("../enums/permissions");
const { Permission } = require("../models");

async function syncPermissions() {
  let permissionsInCode = Object.keys(permissions);
  const permissionsInDB = await Permission.findAll();
  const permissionsInDBAsObject = permissionsInDB.reduce((obj, perm) => ({ ...obj, [perm.type]: perm.name }), {});
  const newPermissions = permissionsInCode.reduce(
    (acc, perm) => [...acc, ...(perm in permissionsInDBAsObject ? [] : [{ type: perm, name: permissions[perm] }])],
    []
  );
  console.log("newPerm", newPermissions);
  return await Permission.bulkCreate(newPermissions);
}

module.exports = { syncPermissions };
