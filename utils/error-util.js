// Utility class for providing custom Error

exports.NotFound = function(message, url) {
    let error = new Error();
    error.statusCode = 404;
    error.name = "NotFound";
    error.message = message;
    error.url = url;
    return error;
};

exports.BadRequest = function (message, url, name) {
    let error = new Error();
    error.statusCode = 400;
    error.name = name;
    error.message = message;
    error.url = url;
    return error;
};