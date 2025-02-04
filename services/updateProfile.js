const AWS = require("aws-sdk");
const util = require("../utils/util");

AWS.config.update({ region: "us-east-1" });
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const userTable = "AuthUserTable";
const bucketName = "backend-storage-auth-bucket"; // ✅ Change this to your S3 bucket name

async function updateProfilePicture(user) {
  const { email, imageBase64 } = user;

  if (!email || !imageBase64) {
    return util.buildResponse(400, { message: "Email and image required" });
  }

  const imageUrl = await uploadImageToS3(email, imageBase64);
  if (!imageUrl) {
    return util.buildResponse(500, { message: "Image upload failed" });
  }

  const params = {
    TableName: userTable,
    Key: { email },
    UpdateExpression: "set imageUrl = :imageUrl",
    ExpressionAttributeValues: { ":imageUrl": imageUrl },
    ReturnValues: "UPDATED_NEW",
  };

  try {
    await dynamoDb.update(params).promise();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Profile picture updated",
        imageUrl,
      }),
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Error updating profile picture" }),
    };
  }
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

module.exports.updateProfilePicture = updateProfilePicture;
