const { authenticator } = require('otplib');
const config = require('../config');

exports.digitizie = (value, places) => {
  let strValue = (value + "")
  return new Array(places - strValue.length).fill('0').join('') + strValue
}

exports.generateOTP = () => {
  return authenticator.generate(config.OTP_SECRET);
}
