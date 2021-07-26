const { User, Role, PermissionAccess, Permission } = require('../models');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { ROLES, APPS } = require('../enums');

module.exports.isLoggedIn = (req, res, next) => {
  let token = req.headers['authorization'];
  token = token && token.replace('Bearer ', '');
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: 'No token provided.' });

  jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
    if (err)
      return res
        .status(401)
        .json({ success: false, message: 'Failed to authenticate token.' });
    const user = await User.findOne({
      where: { id: decoded.id },
      include: [
        {
          model: Role,
          include: [
            { model: PermissionAccess, include: [{ model: Permission }] },
          ],
        },
      ],
    });
    console.log("user.Role.PermissionAccesses",user.Role.PermissionAccesses)
    // user.Role.permissionAccesses.map(i => console.log("item",i))
    if (!user) return res.status(401).json({
      status: false,
      message: "User doesn't exist"
    });
    if (!user.isActive) return res.status(401).json({
      status: false,
      message: 'User is inactive'
    });
    if (!user.companyId) return res.status(401).json({
      status: false,
      message: 'User is not assigned to any company!'
    });
    req.userId = decoded.id;
    req.companyId = user.companyId;
    user.password = undefined
    req.user = user;
    return next();
  });
};

module.exports.isSuperAdmin = (req, res, next) => {
  if (req.user.Role.type == 'SUPER_ADMIN')
    if (next) next();
    else return true;
  else if (next)
    res.status(401).json({ status: false, message: 'Operation not permitted!' });
  else return false;
};

module.exports.checkPermission = permission => (req, res, next) => {
  if (req.user.Role.PermissionAccesses.find((permissionAccess) => permissionAccess.Permission.type == permission))
    if (next) next();
    else return true;
  else if (next)
    res.status(401).json({ status: false, message: 'Operation not permitted!' });
  else return false;
};
