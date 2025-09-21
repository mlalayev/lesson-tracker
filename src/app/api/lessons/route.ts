import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

// GET - Fetch all lessons for a user
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
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

    return NextResponse.json({ 
      lessons: user.lessons,
      templates: user.templates,
      salaries: user.salaries || []
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}

// POST - Save lessons and templates for a user
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { lessons, templates, userId } = await request.json();
    
    console.log('=== API ROUTE DEBUG ===');
    console.log('Received userId:', userId);
    console.log('Received lessons count:', lessons?.length || 0);
    
    if (lessons && lessons.length > 0) {
      console.log('First lesson received:', lessons[0]);
      console.log('First lesson has date?', !!lessons[0].date);
      console.log('All lesson fields:', Object.keys(lessons[0]));
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    
    if (lessons !== undefined) {
      // ENSURE ALL LESSONS HAVE DATE FIELDS BEFORE SAVING
      const lessonsWithValidDates = lessons.map((lesson: any, index: number) => {
        console.log(`API: Checking lesson ${index + 1}:`, lesson);
        console.log(`API: Lesson ${index + 1} has date?`, !!lesson.date);
        
        if (!lesson.date) {
          console.error(`API: CRITICAL - Lesson ${index + 1} missing date field!`, lesson);
          console.error('API: REJECTING lesson without date - will not save to MongoDB');
          // Don't save lessons without dates
          return null;
        }
        
        // DOUBLE CHECK: Ensure date exists and is valid
        if (typeof lesson.date !== 'string' || lesson.date.trim() === '') {
          console.error(`API: CRITICAL - Lesson ${index + 1} has invalid date:`, lesson.date);
          return null;
        }
        
        return lesson;
      }).filter(Boolean); // Remove null entries
      
      console.log(`API: Original lessons: ${lessons.length}, Valid lessons with dates: ${lessonsWithValidDates.length}`);
      
      updateData.lessons = lessonsWithValidDates;
      console.log('Setting updateData.lessons with', lessonsWithValidDates.length, 'lessons');
    }
    
    if (templates !== undefined) {
      updateData.templates = templates;
    }

    // Try to find and update user by ID first, then by email
    let user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, upsert: false }
    );
    
    if (!user) {
      user = await User.findOneAndUpdate(
        { email: userId },
        updateData,
        { new: true, upsert: false }
      );
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Data saved successfully',
      lessons: user.lessons,
      templates: user.templates
    });
  } catch (error) {
    console.error('Error saving user data:', error);
    return NextResponse.json({ error: 'Failed to save user data' }, { status: 500 });
  }
}

// DELETE - Delete a lesson
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const userId = searchParams.get('userId');
    
    if (!lessonId || !userId) {
      return NextResponse.json({ error: 'Lesson ID and User ID are required' }, { status: 400 });
    }

    // Try to find user by ID first, then by email
    let user = await User.findById(userId);
    if (!user) {
      user = await User.findOne({ email: userId });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove lesson from user's lessons array
    user.lessons = user.lessons.filter(lesson => lesson.id !== lessonId);
    await user.save();

    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
