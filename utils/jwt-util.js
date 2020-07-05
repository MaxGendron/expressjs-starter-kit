var jwt = require('jsonwebtoken');
let authUtil = require('./auth-util');

// Validate the JWT token of the request
exports.validateToken = function (req, res, next) {
  const secret = process.env.JWT_SECRET;
  const authHeader = req.header('Authorization');
  jwt.verify(authHeader, secret, { issuer: process.env.JWT_ISSUER }, function (err, decoded) {
    if (err) {
      if (authUtil.isUnauthorizedError(err.name)) {
        err.statusCode = 401;
        return next(err);
      } else {
        return next(err);
      }
    }
    next();
  });
}