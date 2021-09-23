const aws = require('aws-sdk');

const {
  S3_UPLOAD_IAM_USER_SECRET,
  S3_UPLOAD_IAM_USER_KEY,
  maxSize,
  bucket
} = require('../config');

module.exports.s3 = new aws.S3({
  secretAccessKey: S3_UPLOAD_IAM_USER_SECRET,
  accessKeyId: S3_UPLOAD_IAM_USER_KEY,
});

module.exports.previewFile = async (Bucket, Key) => {
  const url = await this.s3.getSignedUrl('getObject', {
    Bucket,
    Key,
    ResponseContentType: 'image/png'
  });
  return url;
}