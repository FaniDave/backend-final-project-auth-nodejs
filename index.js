const AWS = require("aws-sdk");
const util = require("./utils/util");

AWS.config.update({ region: "us-east-1" });

const registerService = require("./services/register");
const loginService = require("./services/login");
const verifyService = require("./services/verify");

const healthPath = "/health";
const registerPath = "/register";
const loginPath = "/login";
const verifyPath = "/verify";

// ✅ AWS Lambda Handler
const handler = async (event) => {
  console.log("Request Event: " + JSON.stringify(event));
  let response;

  if (event) {
    if (event.httpMethod === "GET" && event.path === healthPath) {
      response = util.buildResponse(200, { message: "Health Check OK" });
    } else if (event.httpMethod === "POST" && event.path === registerPath) {
      response = await registerService.register(JSON.parse(event.body));
    } else if (event.httpMethod === "POST" && event.path === loginPath) {
      response = await loginService.login(JSON.parse(event.body));
    } else if (event.httpMethod === "POST" && event.path === verifyPath) {
      response = verifyService.verify(JSON.parse(event.body));
    } else {
      response = util.buildResponse(404, { error: "Not Found" });
    }
  }

  return response;
};

// ✅ CommonJS Export for AWS Lambda
module.exports = { handler };
