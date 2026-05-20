import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './mongo';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_secret';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10);
}

export async function comparePassword(plain, hash) {
  return await bcrypt.compare(plain, hash);
}

export function getTokenFromRequest(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function getCurrentUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const db = await getDb();
  const user = await db.collection('users').findOne({ id: payload.id });
  if (!user) return null;
  delete user.passwordHash;
  return user;
}

export async function ensureSeedAdmin() {
  const db = await getDb();
  const existing = await db.collection('users').findOne({ email: 'privattilawati@gmail.com' });
  if (!existing) {
    const { v4: uuidv4 } = await import('uuid');
    const passwordHash = await hashPassword('admin123');
    await db.collection('users').insertOne({
      id: uuidv4(),
      email: 'privattilawati@gmail.com',
      name: 'Admin Privat Tilawati',
      role: 'admin',
      passwordHash,
      createdAt: new Date().toISOString(),
    });
  }
  // Seed a demo teacher account
  const teacher = await db.collection('users').findOne({ email: 'guru@privattilawati.id' });
  if (!teacher) {
    const { v4: uuidv4 } = await import('uuid');
    const passwordHash = await hashPassword('guru123');
    await db.collection('users').insertOne({
      id: uuidv4(),
      email: 'guru@privattilawati.id',
      name: 'Ustadz Demo',
      role: 'asatidz',
      passwordHash,
      createdAt: new Date().toISOString(),
    });
  }
}
