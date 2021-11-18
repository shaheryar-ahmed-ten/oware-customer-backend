const { authenticator } = require("otplib");
const config = require("../config");
const { Op } = require("sequelize");

exports.digitize = (value, places) => {
  let strValue = value + "";
  return new Array(places - strValue.length).fill("0").join("") + strValue;
};

exports.generateOTP = () => {
  return authenticator.generate(config.OTP_SECRET);
};

exports.sanitizeFilters = (whereClause, transform = {}) => {
  whereClause = this.attachDateFilter(whereClause);
  for (let item in whereClause) {
    if (!item.includes(".to") && !item.includes(".from")) {
      if (whereClause[item] === "true") {
        whereClause[item] = true;
      } else if (whereClause[item] === "false") {
        whereClause[item] = false;
      } else if (!isNaN(Number(whereClause[item]))) {
        whereClause[item] = Number(whereClause[item]);
      }
      if (typeof whereClause[item] === "string") {
        whereClause[item] = { [Op.like]: "%" + whereClause[item] + "%" };
      }
    }
  }
  return whereClause;
};

exports.modelWiseFilters = (filters, modelname) => {
  const filterObj = {};
  for (const key in filters) {
    model = key.split(".")[0];
    if (filterObj[model] == undefined) {
      filterObj[model] = { [key.split(".")[1]]: filters[key] }; //if user model doesn't exist: users = {name:"shaheryar"}
    } else {
      filterObj[model][key.split(".")[1]] = filters[key]; //if user model exist: users.name = "shaheryar"
    }
  }

  let obj = Object.keys(filterObj)
    .map(function (key, index) {
      if (key == modelname) {
        return filterObj[key];
      }
    })
    .filter(function (x) {
      return x !== undefined;
    })[0];

  if (obj) {
    const { to, from } = obj;
    if (to && from) {
      obj = this.removeFromObject(obj, ["to", "from"])[0];
      obj["createdAt"] = {
        [Op.gte]: moment(from).toISOString(),
        [Op.lte]: moment(to).add(1, "seconds").toISOString(),
      };
    }
    return obj;
  } else
    return {
      //include all elements
      id: {
        [Op.gt]: 0,
      },
    };
};

exports.attachDateFilter = (filters) => {
  const { to, from } = filters;
  if (to && from) {
    createdAt = {
      [Op.gte]: moment(from).toISOString(),
      [Op.lte]: moment(to).add(1, "seconds").toISOString(),
    };
    filters["createdAt"] = createdAt;
    delete filters.to;
    delete filters.from;
  }
  return filters;
};

exports.removeFromObject = (obj, keys = []) => {
  if (Array.isArray(obj)) {
    return Object.assign([], obj).map((item) => {
      keys.forEach((key) => {
        if (item.hasOwnProperty(key)) {
          delete item[key];
        }
      });
      return item;
    });
  } else {
    return [Object.assign({}, obj)].map((item) => {
      keys.forEach((key) => {
        if (item.hasOwnProperty(key)) {
          delete item[key];
        }
      });
      return item;
    });
  }
};

exports.removeChildModelFilters = (where) => {
  for (const key in where) {
    if (key.includes(".")) delete where[key];
  }
  return where;
};
