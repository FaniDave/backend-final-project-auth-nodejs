const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const util = require("../utils/util");
const auth = require("../utils/auth");

AWS.config.update({ region: "us-east-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const userTable = "AuthUserTable"; // ✅ UPDATED TABLE NAME

async function login(user) {
  const { email, password } = user;

  if (!email || !password) {
    return util.buildResponse(400, {
      message: "Email and password are required",
    });
  }

  const existingUser = await getUser(email.toLowerCase().trim());
  if (!existingUser) {
    return util.buildResponse(403, { message: "User doesn't exist" });
  }

  if (!bcrypt.compareSync(password, existingUser.password)) {
    return util.buildResponse(403, { message: "Incorrect password" });
  }

  const userInfo = { email: existingUser.email, name: existingUser.userName };
  const token = auth.generateToken(userInfo);

  return util.buildResponse(200, { user: userInfo, token });
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

module.exports.login = login;
