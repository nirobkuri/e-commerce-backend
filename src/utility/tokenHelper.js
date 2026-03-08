const jwt = require("jsonwebtoken");
const { token } = require("morgan");
exports.EncodeToken = (email, _id) => {
    let key = process.env.JWT_KEY;
    let expire = process.env.JWT_Expire_Time;

    let payload = { email, _id };
    return jwt.sign(payload, key, { expiresIn: expire })

}

exports.DecodeToken = (email) => {
    try {
        let key = process.env.JWT_KEY;
        let decoded = jwt.verify(token, key)
        return decoded
    } catch (error) {
        return null;
    }

}