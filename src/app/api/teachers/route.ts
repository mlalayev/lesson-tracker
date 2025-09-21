import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get all users with role 'EMPLOYEE' (teachers)
    const teachers = await User.find({ role: 'EMPLOYEE' })
      .select('_id name email role')
      .sort({ name: 1 });

    return NextResponse.json({
      teachers: teachers.map(teacher => ({
        id: teacher._id.toString(),
        name: teacher.name,
        email: teacher.email,
        role: teacher.role
      }))
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

