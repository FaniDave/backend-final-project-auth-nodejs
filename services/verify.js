const util = require("../utils/util");
const auth = require("../utils/auth");

function verify(requestBody) {
  if (!requestBody.user || !requestBody.user.email || !requestBody.token) {
    return util.buildResponse(400, {
      verified: false,
      message: "Invalid request body",
    });
  }

  const { email, token } = requestBody;
  const verification = auth.verifyToken(email, token);

  if (!verification.verified) {
    return util.buildResponse(401, verification);
  }

  return util.buildResponse(200, {
    verified: true,
    message: "Token is valid",
    user: requestBody.user,
    token,
  });
}

module.exports.verify = verify;
