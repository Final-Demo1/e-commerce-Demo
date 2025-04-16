
import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";
import { UserModel } from "../models/user.js";

// Middleware to check if user is authenticated using express-jwt
export const isAuthenticated = expressjwt({
  secret: process.env.JWT_SECRET_KEY,
  algorithms: ['HS256'],
});

// Middleware to check if user is authorized (has the correct role)
export const isAuthorized = (roles) => {
  return async (req, res, next) => {
    try {
      // Find user by ID from the decoded token
      const user = await UserModel.findById(req.auth.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user's role is allowed
      if (roles.includes(user.role)) {
        next();
      } else {
        res.status(403).json({ message: "You are not authorized" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
};

// Alternative JWT authentication middleware (if express-jwt is not used)
export const jwtAuth = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authorization.split(" ")[1]; // Extract the token
  if (!token) {
    return res.status(401).json({ message: "Access token not provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token", error: err });
    }
    req.user = decoded;
    next();
  });
};
export default isAuthenticated;




















