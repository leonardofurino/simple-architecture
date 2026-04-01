"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServiceUtils = exports.UnauthorizedTokenError = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const configInitResult = dotenv.config({ path: path_1.default.resolve(process.cwd(), '.env') });
if (configInitResult.error) {
    console.error("Error loading .env:", configInitResult.error);
    process.exit(1);
}
const secret = process.env.JWT_SECRET_KEY;
const expiry = process.env.JWT_SECRET_KEY_EXP;
if (!secret || !expiry) {
    console.log("secret: {}", secret);
    console.log("expiry: {}", expiry);
    throw new Error("Error loading .env JWT_SECRET_KEY or JWT_SECRET_KEY_EXP!");
}
class UnauthorizedTokenError extends Error {
    constructor(message = "Not valid Token") {
        super(message);
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedTokenError = UnauthorizedTokenError;
class AuthServiceUtils {
    static generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: process.env.JWT_SECRET_KEY_EXP });
    }
    static verifyToken(token) {
        try {
            console.debug("verifying token: %s ....", token.substring(0, 5));
            return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        }
        catch (error) {
            throw new UnauthorizedTokenError();
        }
    }
}
exports.AuthServiceUtils = AuthServiceUtils;
