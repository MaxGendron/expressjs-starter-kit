// Utility class for providing custom Error

exports.NotFound = function(message, route) {
    let error = new Error();
    error.statusCode = 404;
    error.name = "NotFound";
    error.message = message;
    error.route = route;
    return error;
};

exports.BadRequest = function (message, route, name) {
    let error = new Error();
    error.statusCode = 400;
    error.name = name;
    error.message = message;
    error.route = route;
    return error;
};