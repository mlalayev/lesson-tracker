import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!teacherId || !year || !month) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const user = await User.findById(teacherId);
    if (!user) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get salary from MongoDB
    const salary = user.salaries.find(s => 
      s.year === parseInt(year) && s.month === parseInt(month)
    );
    
    return NextResponse.json({
      teacherId,
      year: parseInt(year),
      month: parseInt(month),
      salary: salary?.salary || null
    });
  } catch (error) {
    console.error('Error fetching teacher salary:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher salary' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { teacherId, year, month, salary } = await request.json();

    if (!teacherId || !year || !month || salary === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const user = await User.findById(teacherId);
    if (!user) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Update or add salary in MongoDB
    const existingSalaryIndex = user.salaries.findIndex(s => 
      s.year === year && s.month === month
    );

    if (existingSalaryIndex >= 0) {
      // Update existing salary
      user.salaries[existingSalaryIndex].salary = salary;
    } else {
      // Add new salary
      user.salaries.push({ year, month, salary });
    }

    await user.save();
    
    return NextResponse.json({
      message: 'Salary saved successfully',
      teacherId,
      year,
      month,
      salary
    });
  } catch (error) {
    console.error('Error saving teacher salary:', error);
    return NextResponse.json({ error: 'Failed to save teacher salary' }, { status: 500 });
  }
}

