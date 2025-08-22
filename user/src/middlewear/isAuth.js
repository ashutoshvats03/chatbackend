import jwt from "jsonwebtoken";

export const isAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Please login : No auth error" });
        }

        const token = authHeader.split(" ")[1];
        const decodeValue = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodeValue || !decodeValue.user) {
            return res.status(401).json({ message: "Inavlid token" });
        }

        // attaching decoded user info to request
        req.user = decodeValue.user; 
        next();
    } catch (error) {
        return res.status(401).json({ message: "please login : jwt error" });
    }
};
