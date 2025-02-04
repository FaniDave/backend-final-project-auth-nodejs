const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const util = require("../utils/util");
const s3 = new AWS.S3();

AWS.config.update({ region: "us-east-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const userTable = "AuthUserTable"; // ✅ UPDATED TABLE NAME
const bucketName = "backend-storage-auth-bucket"; // ✅ Change this to your S3 bucket name

async function register(userInfo) {
  const { email, password, userName, imageBase64 } = userInfo;

  if (!email || !password || !userName || !imageBase64) {
    return util.buildResponse(400, { message: "All fields are required" });
  }

  const existingUser = await getUser(email.toLowerCase().trim());
  if (existingUser) {
    return util.buildResponse(409, { message: "Email already exists" });
  }

  const encryptedPassword = bcrypt.hashSync(password.trim(), 10);
  const imageUrl = await uploadImageToS3(email, imageBase64);

  if (!imageUrl) {
    return util.buildResponse(500, { message: "Image upload failed" });
  }

  const user = {
    email: email.toLowerCase().trim(),
    userName,
    password: encryptedPassword,
    imageUrl,
  };

  const saved = await saveUser(user);
  if (!saved) {
    return util.buildResponse(503, {
      message: "Server error. Try again later.",
    });
  }

  return util.buildResponse(201, { email, imageUrl });
}

async function uploadImageToS3(email, imageBase64) {
  const buffer = Buffer.from(imageBase64, "base64");
  const params = {
    Bucket: bucketName,
    Key: `profile-pictures/${email}.jpg`,
    Body: buffer,
    ContentType: "image/jpeg"
  };

  try {
    const { Location } = await s3.upload(params).promise();
    return Location;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

async function getUser(email) {
  const params = { TableName: userTable, Key: { email } };

  try {
    const result = await dynamoDb.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

async function saveUser(user) {
  const params = { TableName: userTable, Item: user };

  try {
    await dynamoDb.put(params).promise();
    return true;
  } catch (error) {
    console.error("Error saving user:", error);
    return false;
  }
}

module.exports.register = register;
