import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET = process.env.JWT_SECRET || 'sosaround-dev-secret-change-me';
const EXPIRES_IN = '30d';

export interface JwtPayload {
  idUtente: string;
}

export function firmaToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verificaToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Estende Request con l'utente autenticato
export interface AuthRequest extends Request {
  idUtente?: string;
}

// Middleware Express: richiede un Bearer token valido
export function authGuard(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verificaToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: 'Non autorizzato.' });
    return;
  }
  req.idUtente = payload.idUtente;
  next();
}
