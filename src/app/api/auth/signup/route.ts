import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, passwordHash });
    return NextResponse.json({ id: user._id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


