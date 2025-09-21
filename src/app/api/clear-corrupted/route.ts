import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

// POST - Clear corrupted lesson data (lessons without date field)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Try to find user by ID first, then by email
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ email: userId });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    
    // Find lessons without date field
    const lessonsWithoutDate = user.lessons?.filter((lesson: any) => !lesson.date) || [];
    const validLessons = user.lessons?.filter((lesson: any) => lesson.date) || [];
    
    
    if (lessonsWithoutDate.length > 0) {
      // Update user with only valid lessons
      user.lessons = validLessons;
      await user.save();
      
      return NextResponse.json({ 
        message: `Cleared ${lessonsWithoutDate.length} corrupted lessons, kept ${validLessons.length} valid lessons`,
        clearedCount: lessonsWithoutDate.length,
        validCount: validLessons.length,
        templates: user.templates
      });
    } else {
      return NextResponse.json({ 
        message: 'No corrupted lessons found',
        clearedCount: 0,
        validCount: validLessons.length,
        templates: user.templates
      });
    }
    
  } catch (error) {
    console.error('Error clearing corrupted data:', error);
    return NextResponse.json({ error: 'Failed to clear corrupted data' }, { status: 500 });
  }
}
