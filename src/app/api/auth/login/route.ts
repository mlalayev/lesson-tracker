import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    return NextResponse.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


