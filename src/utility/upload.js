
const sharp = require('sharp')
const AWS = require('aws-sdk');

const ID = process.env.AWS_KEY_ID;
const SECRET = process.env.AWS_SECRET_KEY;

const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

// The name of the bucket that you have created
const BUCKET_NAME = 'feedhunt-public';

const uploadImage = async (req) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 500 }).png().toBuffer()
    const timestamp = Date.now()
    const params = {
        Bucket: BUCKET_NAME,
        Key: `feedhunt-images/${req.file.originalname}-${timestamp}.png`, // File name you want to save as in S3
        Body: buffer
    };

    // Uploading files to the bucket
    const uploaded = s3.upload(params).promise()
    return uploaded
}

module.exports = uploadImage