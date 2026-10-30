import type { Request, Response } from 'express';
import app from '../server/app';
import { dbManager } from '../server/db';

let isDbConnected = false;

export default async function handler(req: Request, res: Response) {
  if (!isDbConnected) {
    try {
      await dbManager.connect();
      isDbConnected = true;
    } catch (err) {
      console.error('Failed to initialize database in Vercel function:', err);
    }
  }

  return app(req, res);
}
