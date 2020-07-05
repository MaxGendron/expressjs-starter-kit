let express = require('express');
var jwt = require('jsonwebtoken');
let router = express.Router();
let authUtil = require('../utils/auth-util');
let errorUtil = require('../utils/error-util');
let validatorUtil = require('../utils/validator-util');
const _secret = process.env.JWT_SECRET;

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
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 username:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/400'
 *       Default:
 *          $ref: '#/components/responses/Default'
 */
router.post('/', function (req, res, next) {
  const url = req.method + req.originalUrl;
  const db = req.app.locals.db;
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  
  //Verify input
  if (!username) {
    return next(errorUtil.BadRequest('Undefined parameter: username', url, 'UndefinedParameter'));
  }
  if (!password) {
    return next(errorUtil.BadRequest('Undefined parameter: password', url, 'UndefinedParameter'));
  }
  if (!email) {
    return next(errorUtil.BadRequest('Undefined parameter: password', url, 'UndefinedParameter'));
  }
  if (!validatorUtil.validateEmail(email)) {
    return next(errorUtil.BadRequest('Bad parameter: email', url, 'BadParameter'));
  }

  //Check if the user already exist, if so return error
  //Sanity check, shouldn't happens since we're validating on the UI
  db.collection('User').countDocuments({
    '$or': [
      {username: username},
      {email: email}
    ]
  }, { limit: 1 }, function (err, count) {
    if (err) {
      err.url = url;
      return next(err);
    }
    if (count > 0) {
      return next(errorUtil.BadRequest('Cannot Insert the requested user, verify your information', url, 'CannotInsert'));
    }

    //Encrypt the password
    authUtil.encryptPassword(password, function (err, hash) {
      if (err) {
        err.url = url;
        return next(err);
      }

      //If user don't exist, insert it
      db.collection('User').insertOne({
        username: username,
        email: email,
        password: hash,
      }, function (err, doc) {
        if (err) {
          err.url = url;
          return next(err);
        }

        //Sign a JWT token and return it with the found user
        jwt.sign({ username: username, _id: doc._id }, _secret, { algorithm: 'HS512', expiresIn: '24h', issuer: process.env.JWT_ISSUER },
          function (err, token) {
            if (err) {
              err.url = url;
              return next(err);
            }
            const user = {
              username: username,
              token: token
            }
            res.json({ user: user });
          });
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
 *     description: Validate that the given username/password correspond to a user in the system.
 *     tags: [Users]
 *     produces:
 *        application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *              username:
 *               type: string
 *              password:
 *               type: string
 *             required:  
 *              - username
 *              - password
 *     responses:
 *       200:
 *         description: The given username/password correspond to a user in the system.
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 username:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/400'
 *       404:
 *         $ref: '#/components/responses/404'
 *       Default:
 *         $ref: '#/components/responses/Default'
 */
router.post('/validate', function (req, res, next) {
  const url = req.method + req.originalUrl;
  const db = req.app.locals.db;
  const username = req.body.username;
  const password = req.body.password;

  //Verify input
  if (!username) {
    return next(errorUtil.BadRequest('Undefined parameter: username', url, 'UndefinedParameter'));
  }
  if (!password) {
    return next(errorUtil.BadRequest('Undefined parameter: password', url, 'UndefinedParameter'));
  }

  //Look for the associated doc in the DB
  //Username can be the email or the username
  db.collection('User').findOne({
    '$or': [
      {username: username},
      {email: username}
    ]
  }, function (err, doc) {
    if (err) {
      err.url = url;
      return next(err);
    }
    //Return error if no doc found
    if (doc === null) {
      return next(errorUtil.NotFound('No user found', url));
    } else {
      //Compare given password to the db one
      authUtil.comparePassword(password, doc.password, function (err, isValid) {
        if (err) {
          err.url = url;
          return next(err);
        }
        //If password match, sign a JWT token and return it with the found user
        if (isValid) {
          jwt.sign({ username: username, _id: doc._id }, _secret, { algorithm: 'HS512', expiresIn: '24h', issuer: process.env.JWT_ISSUER },
          function (err, token) {
            if (err) {
              err.url = url;
              return next(err);
            }
            const user = {
              username: doc.username,
              token: token
            }
            res.json({ user: user });
          });
        } else {
          //If not valid return notFound
          return next(errorUtil.NotFound('No user found', url));
        }
      });
    }
  });
});

/**
 * @swagger
 *
 * /users/exist:
 *   post:
 *     summary: Validate if a user exist
 *     description: Validate if a user exist by looking at the number of document returned by the query.
 *     tags: [Users]
 *     produces:
 *        application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               query:
 *                 type: object
 *     responses:
 *       200:
 *         description: User exist or not in the system.
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 exist:
 *                   type: boolean
 *       400:
 *         $ref: '#/components/responses/400'
 *       Default:
 *         $ref: '#/components/responses/Default'
 */
router.post('/exist', function (req, res, next) {
  const url = req.method + req.originalUrl;
  const db = req.app.locals.db;
  const query = req.body.query;

  //Verify input
  if (!query) {
    return next(errorUtil.BadRequest('Undefined parameter: query'), url, 'UndefinedParameter');
  }

  db.collection('User').countDocuments(query, { limit: 1 }, function (err, count) {
    if (err) {
      err.url = url;
      return next(err);
    }

    res.json({ exist: count > 0 });
  });
});

module.exports = router;