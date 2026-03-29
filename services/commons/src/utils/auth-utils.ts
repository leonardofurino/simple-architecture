import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';

export interface JwtPayload {
    tenantId: string;
    user: string;
}

const configInitResult = dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (configInitResult.error) {
    console.error("Error loading .env:", configInitResult.error);
    process.exit(1); 
}
const secret = process.env.JWT_SECRET_KEY;
const expiry = process.env.JWT_SECRET_KEY_EXP;

if (!secret || !expiry) {
    console.log("secret: {}",secret);
    console.log("expiry: {}",expiry);
    throw new Error("Error loading .env JWT_SECRET_KEY or JWT_SECRET_KEY_EXP!");
}

export class UnauthorizedTokenError extends Error {
  constructor(message: string = "Not valid Token") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class AuthServiceUtils {

    static generateToken(payload: JwtPayload): string {
        return jwt.sign(payload, secret!, { expiresIn: process.env.JWT_SECRET_KEY_EXP as any });
    }

    static verifyToken(token: string): JwtPayload {
        try {
            console.debug("verifying token: %s", token);
            return jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;
        } catch (error) {
            throw new UnauthorizedTokenError();
        }
    }
}