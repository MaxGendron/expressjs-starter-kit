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
    app.locals.db = client.db('WMS');
    dbClient = client;
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
app.use(express.static(path.join(__dirname, 'public')));


// Routes
let appointmentRouter = require('./routes/appointment');
let adminUserRouter = require('./routes/admin-user');
let clientRouter = require('./routes/client');
let employeeRouter = require('./routes/employee');

app.use('/api/appointment', appointmentRouter);
app.use('/api/adminUser', adminUserRouter);
app.use('/api/client', clientRouter);
app.use('/api/employee', employeeRouter);

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
