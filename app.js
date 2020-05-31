let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let app = express();
var http = require('http');
let cors = require('cors');
require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.MONGOBD_STRING;
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
    var port = normalizePort(process.env.PORT || '3000');
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
let userRoute = require('./routes/user');

app.use('/api/user', userRoute);

// Error Handler
app.use(function(err, req, res, next) {
    if (err.route) {
        console.log('Error when execution route "' + err.route + '".');
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

function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}
