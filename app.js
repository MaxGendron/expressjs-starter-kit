let express = require('express');
let app = express();
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGOBD_STRING;
const port = process.env.PORT || '3000';

//Swagger
const swaggerJSDocOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'ExpressJS-Starter-Kit', 
        version: '1.0.0',
        description: 'Starter kit of an express-js app'
      },
      servers: [
        {url: `http://localhost:3000/api` }
      ]
    },
    // Path to the API docs
    apis: ['./swagger/*', './routes/*'],
};
const swaggerSpec = swaggerJSDoc(swaggerJSDocOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

const corsOptions = {
    //Check if the origin is in the list of cors defined in the
    //env, if so let it pass otherwise return a error
    origin: function (origin, callback) {
        if (process.env.CORS_ORIGIN.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200
};

// Set mongoDbClient in everyRequest & open server if connection is made
let dbClient;
MongoClient.connect(uri, {
    useNewUrlParser: true
}, function (err, client) {
    if (err) {
        console.log('An error as occurred when connecting to mongo: ');
        console.log(err);
        return;
    }
    app.locals.db = client.db('DBNAME');
    dbClient = client;

    //Set the port and listen to it
    app.set('port', port);
    var server = http.createServer(app);
    server.listen(port);
});

// Basic declaration
app.use(cors(corsOptions))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
const basePath = '/api/';
const userRoute = require('./routes/users');
app.use(`${basePath}users` , userRoute);

// Error Handler
app.use(function(err, req, res, next) {
    if (err.route) {
        console.log(`Error when executing route ${err.route}.`);
    } else {
        console.log('An error as occurred.');
    }

    console.log(err);

    let statusCode = err.statusCode ? err.statusCode : 500;
    res.status(statusCode).send(err);
});

//Close the db connection on exit
process.on('SIGINT', () => {
    dbClient.close();
    process.exit();
});
