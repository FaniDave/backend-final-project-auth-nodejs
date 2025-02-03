const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const util = require("../utils/util");

AWS.config.update({ region: "us-east-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const userTable = "AuthUserTable"; // ✅ UPDATED TABLE NAME

async function register(userInfo) {
  const { email, password, userName } = userInfo;

  if (!email || !password || !userName) {
    return util.buildResponse(400, { message: "All fields are required" });
  }

  const existingUser = await getUser(email.toLowerCase().trim());
  if (existingUser) {
    return util.buildResponse(409, { message: "Email already exists" });
  }

  const encryptedPassword = bcrypt.hashSync(password.trim(), 10);
  const user = {
    email: email.toLowerCase().trim(),
    userName,
    password: encryptedPassword,
  };

  const saved = await saveUser(user);
  if (!saved) {
    return util.buildResponse(503, {
      message: "Server error. Please try again later.",
    });
  }

  return util.buildResponse(201, { email });
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
