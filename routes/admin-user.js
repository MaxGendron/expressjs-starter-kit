let express = require('express');
var jwt = require('jsonwebtoken');
let router = express.Router();
let authUtil = require('../utils/auth-util');
let errorUtil = require('../utils/error-util');
let jwtUtil = require('../utils/jwt-util');
let ObjectId = require('mongodb').ObjectID;

// Insert an admin user
router.post('/', jwtUtil.validateToken, function (req, res, next) {
    if (!req.body.username) {
        return next(errorUtil.BadRequest('Undefined parameter: username', 'POST:api/adminUser', 'UndefinedParameter'));
    }
    if (!req.body.password) {
        return next(errorUtil.BadRequest('Undefined parameter: password', 'POST:api/adminUser', 'UndefinedParameter'));
    }
    if (!req.body.employeeId) {
        return next(errorUtil.BadRequest('Undefined parameter: employeeId', 'POST:api/adminUser', 'UndefinedParameter'));
    }
    if (!ObjectId.isValid(req.body.employeeId)) {
        return next(errorUtil.BadRequest('The given employeeId is not an mongodb ObjectId: ' + req.body.employeeId, 'GET:api/appointment/month', 'InvalidObjectId'));
    }

    const db = req.app.locals.db;
    const username = req.body.username;
    const password = req.body.password;
    const employeeId = new ObjectId(req.body.employeeId);
    authUtil.cryptPassword(password, function (err, hash) {
        if (err) {
            err.route = 'POST:api/adminUser';
            return next(err);
        }
        db.collection('AdminUser').countDocuments({
            '$or': [
                {username: username},
                {employeeId: employeeId}
            ]
        }, { limit: 1 }, function (err, count) {
            if (err) {
                err.route = 'POST:api/adminUser';
                return next(err);
            }
            if (count > 0) {
                return next(errorUtil.BadRequest('Cannot Insert the requested user, verify your informations', 'POST:api/adminUser', 'CannotInsert'));
            }

            db.collection('AdminUser').insertOne({
                username: username,
                password: hash,
                employeeId :employeeId
            }, function (err, docInserted) {
                if (err) {
                    err.route = 'POST:api/adminUser';
                    return next(err);
                }
                res.json({ "insertedCount": docInserted.insertedCount });
            });
        });
    });
});

//ValidateUser
router.post('/validate', function (req, res, next) {
    if (!req.body.username) {
        return next(errorUtil.BadRequest('Undefined parameter: username', 'POST:api/adminUser/validate', 'UndefinedParameter'));
    }
    if (!req.body.password) {
        return next(errorUtil.BadRequest('Undefined parameter: password', 'POST:api/adminUser/validate', 'UndefinedParameter'));
    }
    const db = req.app.locals.db;
    const username = req.body.username;
    const password = req.body.password;
    db.collection('AdminUser').findOne({ username: username }, function (err, doc) {
        if (err) {
            err.route = 'POST:api/adminUser/validate';
            return next(err);
        }
        if (doc === null) {
            return next(errorUtil.NotFound('No user found for username: ' + username, 'POST:api/adminUser/validate'));
        } else {
            authUtil.comparePassword(password, doc.password, function (err, isValid) {
                if (err) {
                    err.route = 'POST:api/adminUser/validate';
                    return next(err);
                }
                const secret = process.env.JWT_SECRET;
                jwt.sign({ username: username, _id: doc._id }, secret, { algorithm: 'HS512', expiresIn: '24h', issuer: process.env.JWT_ISSUER }, function (err, token) {
                    if (err) {
                        err.route = 'POST:api/adminUser/validate';
                        return next(err);
                    }
                    const user = {
                        username: doc.username,
                        employeeId: doc.employeeId,
                        token: token
                    }
                    res.json({ user: user, isValid: isValid });
                });
            });
        }
    });
});

module.exports = router;