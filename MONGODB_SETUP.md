# MongoDB Integration Setup

This application now supports saving lesson data to both localStorage and MongoDB for better data persistence and synchronization.

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/lesson-tracker
MONGODB_DB=lesson-tracker

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-here
```

## Database Structure

### User Document Structure
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  role: String, // 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  passwordHash: String,
  templates: {
    odd: [TemplateLesson],    // Odd days template lessons
    even: [TemplateLesson]    // Even days template lessons
  },
  lessons: [Lesson],          // User's actual lessons
  createdAt: Date,
  updatedAt: Date
}
```

### TemplateLesson/Lesson Structure
```javascript
{
  id: String,           // Unique identifier
  time: String,         // Time (e.g., "09:00")
  subject: String,      // Subject name
  studentName: String,  // Student names (comma-separated)
  notes: String,        // Optional notes
  duration: Number      // Duration in minutes
}
```

## Features

### Dual Storage System
- **localStorage**: Fast local storage for immediate UI updates
- **MongoDB**: Persistent cloud storage for data backup and synchronization

### User-Specific Data Organization
- Each user has their own lessons and templates
- Templates (odd/even) are stored per user
- All data is associated with the authenticated user

### Automatic Synchronization
- All lesson and template operations are saved to both localStorage and MongoDB
- If MongoDB is unavailable, the app falls back to localStorage only
- Data is automatically synced when the app loads

## API Endpoints

### GET /api/lessons
- Fetches all lessons and templates for a specific user
- Query parameter: `userId`
- Returns: `{ lessons: Lesson[], templates: { odd: Lesson[], even: Lesson[] } }`

### POST /api/lessons
- Saves lessons and/or templates for a user
- Body: `{ lessons?: Lesson[], templates?: { odd: Lesson[], even: Lesson[] }, userId: string }`

### DELETE /api/lessons
- Deletes a specific lesson
- Query parameters: `lessonId` and `userId`

## Data Flow

1. **User Action** (add/edit/delete lesson or template)
2. **Update localStorage** (immediate UI update)
3. **Sync to MongoDB** (background operation)
4. **Fallback handling** (if MongoDB fails, continue with localStorage)

## Benefits

- **Offline Support**: App works even without internet connection
- **Data Persistence**: Lessons and templates are never lost
- **Multi-device Sync**: Access lessons from any device
- **User Isolation**: Each user's data is completely separate
- **Template Management**: Templates are user-specific and persistent
- **Backup**: Automatic cloud backup of all data
- **Performance**: Fast local storage with cloud sync

## Error Handling

- MongoDB connection failures don't break the app
- Automatic fallback to localStorage
- Console logging for debugging
- User-friendly error messages
