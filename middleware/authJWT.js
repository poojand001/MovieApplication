const jwt = require("jsonwebtoken");
verifytoken = (req, res, next) => {
    let token = req.headers["authorization"].split(' ')[1];
    if (!token) {
        return res.status(403).send({
            message: "No token provided"
        });
    }

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: "Unauthorized to access this resource"
            });
        }
        req.username = decoded.id;
        next();
    });
};
const authJWT = {
    verifytoken: verifytoken
}
module.exports = authJWT;