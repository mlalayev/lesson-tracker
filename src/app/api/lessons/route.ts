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

    const user = await User.findById(userId);
    
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
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    
    if (lessons !== undefined) {
      updateData.lessons = lessons;
    }
    
    if (templates !== undefined) {
      updateData.templates = templates;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, upsert: false }
    );
    
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

    const user = await User.findById(userId);
    
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
