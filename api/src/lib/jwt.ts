import jwt from "jsonwebtoken";
import { config } from "../config/env";

export function signJwt(payload: Record<string, any>) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: `${config.jwt.expiresDays}d`,
  });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, config.jwt.secret) as Record<string, any>;
}
