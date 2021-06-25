const jwt = require("jsonwebtoken");
const config = require("config");
module.exports = function (req, res, next) {
  //Geting token from header
  const token = req.header("x-auth-token");
  //Check if no token
  if (!token) {
    res.status(401).json({ msg: "no token, auth denied!" });
  }
  try {
    const decoded = jwt.verify(token, config.get("jwtToken"));
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "invalid token" });
  }
};
