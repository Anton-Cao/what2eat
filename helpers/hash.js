var crypto = require('crypto');

module.exports = function hashPassword(password) {
    return crypto.createHash('md5').update(password + process.env.SALT).digest('hex');
}