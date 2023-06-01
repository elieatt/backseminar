const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWTPRIVATE);
        //console.log("passed");
        console.log(decoded);
        req.id = decoded;
        next();
    } catch {
        console.log("token verify error");
        res.status(403).json({
            message: "auth failed"
        });
    }
}