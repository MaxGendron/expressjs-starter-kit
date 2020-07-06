exports.validateEmail = function (email) {
  const regex = '^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}$';
  const regExp = new RegExp(regex, 'i');
  return regExp.test(email);
}