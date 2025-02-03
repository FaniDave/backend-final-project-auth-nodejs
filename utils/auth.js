const jwt = require("jsonwebtoken");

function generateToken(userInfo) {
  if (!userInfo) return null;

  return jwt.sign(userInfo, process.env.JWT_SECRET, { expiresIn: "1h" });
}

function verifyToken(email, token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.email !== email) {
      return { verified: false, message: "Invalid user" };
    }
    return { verified: true, message: "Token is valid" };
  } catch (error) {
    return { verified: false, message: "Invalid or expired token" };
  }
}

module.exports.generateToken = generateToken;
module.exports.verifyToken = verifyToken;
