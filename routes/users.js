let express = require('express');
var jwt = require('jsonwebtoken');
let router = express.Router();
let authUtil = require('../utils/auth-util');
let errorUtil = require('../utils/error-util');

/**
 * @swagger
 *
 * /users:
 *   post:
 *     summary: Create User
 *     description: Create a new User.
 *     tags: [Users]
 *     produces:
 *        application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: New user has been inserted.
 *       default:
 *          $ref: '#/components/responses/Default'
 */
router.post('/', function (req, res, next) {
    const url = req.method + req.originalUrl;
    //Verify input
    if (!req.body.username) {
        return next(errorUtil.BadRequest('Undefined parameter: username', url, 'UndefinedParameter'));
    }
    if (!req.body.password) {
        return next(errorUtil.BadRequest('Undefined parameter: password', url, 'UndefinedParameter'));
    }

    const db = req.app.locals.db;
    const username = req.body.username;
    const password = req.body.password;
    //Crypt the password
    authUtil.cryptPassword(password, function (err, hash) {
        if (err) {
            err.url = url;
            return next(err);
        }
        //Check if the user already exist, if so return error
        db.collection('User').countDocuments({
            username: username
        }, { limit: 1 }, function (err, count) {
            if (err) {
                err.url = url;
                return next(err);
            }
            if (count > 0) {
                return next(errorUtil.BadRequest('Cannot Insert the requested user, verify your information', url, 'CannotInsert'));
            }

            //If user don't exist, insert it
            db.collection('User').insertOne({
                username: username,
                password: hash,
            }, function (err, doc) {
                console.log(err);
                if (err) {
                    err.url = url;
                    return next(err);
                }
                res.sendStatus(200);
            });
        });
    });
});

/**
 * @swagger
 *
 * /users/validate:
 *   post:
 *     summary: Validate a User
 *     description: Validate that the given user is a user in the system.
 *     tags: [Users]
 *     produces:
 *        application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User exist in the system.
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 username:
 *                   type: string
 *                 token:
 *                   type: string
 *       default:
 *          $ref: '#/components/responses/Default'
 */
router.post('/validate', function (req, res, next) {
    const url = req.method + req.originalUrl;
    //Verify input
    if (!req.body.username) {
        return next(errorUtil.BadRequest('Undefined parameter: username', url, 'UndefinedParameter'));
    }
    if (!req.body.password) {
        return next(errorUtil.BadRequest('Undefined parameter: password', url, 'UndefinedParameter'));
    }

    const db = req.app.locals.db;
    const username = req.body.username;
    const password = req.body.password;
    //Look for the associated doc in the DB
    db.collection('User').findOne({ username: username }, function (err, doc) {
        if (err) {
            err.url = url;
            return next(err);
        }
        //Return error if no doc found
        if (doc === null) {
            return next(errorUtil.NotFound('No user found for username: ' + username, url));
        } else {
            //Compare given password to the db one
            authUtil.comparePassword(password, doc.password, function (err, isValid) {
                if (err) {
                    err.url = url;
                    return next(err);
                }
                //If password match, sign a JWT token and return it with the found user
                const secret = process.env.JWT_SECRET;
                jwt.sign({ username: username, _id: doc._id }, secret, { algorithm: 'HS512', expiresIn: '24h', issuer: process.env.JWT_ISSUER }, function (err, token) {
                    if (err) {
                        err.url = url;
                        return next(err);
                    }
                    const user = {
                        username: doc.username,
                        token: token
                    }
                    res.json({ user: user, isValid: isValid });
                });
            });
        }
    });
});

module.exports = router;