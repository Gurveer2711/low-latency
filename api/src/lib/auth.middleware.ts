import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./jwt";
import { prisma } from "./prisma";

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    const token = auth.split(" ")[1];
    const payload = verifyJwt(token);
    // attach user object to request
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });
    (req as any).user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    if (user.role !== role) return res.status(403).json({ error: "Insufficient role" });
    next();
  };
}
