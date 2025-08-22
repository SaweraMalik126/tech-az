# TeachMe.ai Backend Setup Guide

This guide will help you set up the backend server using Hono and Bun to serve student data to your frontend.

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Node.js (optional, for some dependencies)

### Installation Steps

1. **Navigate to the backend directory:**

   ```bash
   cd Teachme-ai/backend
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Start the development server:**

   ```bash
   bun run dev
   ```

4. **Verify the server is running:**
   - Open your browser and go to `http://localhost:3001`
   - You should see a JSON response with the API status

## 📁 Project Structure

```
backend/
├── src/
│   └── index.ts          # Main server file with all API endpoints
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md            # Backend-specific documentation
├── install-and-run.bat  # Windows setup script
├── install-and-run.sh   # Unix/Linux setup script
└── test-api.js          # API testing script
```

## 🔧 Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run build` - Build for production
- `bun run test` - Run tests (when implemented)

## 🌐 API Endpoints

### Health Check

- `GET /` - Server status and version

### Students

- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/search?q=query` - Search students
- `GET /api/students/:id/progress` - Get student progress

### Courses

- `GET /api/courses/:courseId/students` - Get students by course

## 📊 Sample Data

The backend includes sample student data with:

- 3 students with different profiles
- Course enrollments and progress tracking
- Realistic educational data structure

## 🔍 Testing the API

### Using the Test Script

```bash
cd backend
bun run test-api.js
```

### Manual Testing with curl

```bash
# Health check
curl http://localhost:3001/

# Get all students
curl http://localhost:3001/api/students

# Get specific student
curl http://localhost:3001/api/students/550e8400-e29b-41d4-a716-446655440001

# Search students
curl "http://localhost:3001/api/students/search?q=alex"
```

### Using Browser Developer Tools

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run the test script:
   ```javascript
   // Copy and paste the content of test-api.js
   ```

## 🎯 Frontend Integration

The frontend is already configured to work with the backend:

1. **StudentsList Component** - Displays student data from the API
2. **TeacherDashboard** - Includes the StudentsList in the Students tab
3. **CORS Configuration** - Backend allows requests from frontend dev servers

### Frontend Routes

- Navigate to the Teacher Dashboard
- Click on the "Students" tab
- View the student data fetched from the backend

## 🛠️ Development

### Adding New Endpoints

1. Open `src/index.ts`
2. Add new routes using Hono's routing methods:

```typescript
// Example: Add a new endpoint
app.get("/api/new-endpoint", (c) => {
  return c.json({
    success: true,
    data: { message: "Hello World" },
  });
});
```

### Modifying Student Data

1. Edit the `students` array in `src/index.ts`
2. Add new fields or modify existing ones
3. Restart the server to see changes

### Database Integration

Currently using in-memory data. To integrate with a database:

1. Install database driver (e.g., `@supabase/supabase-js`)
2. Replace the static `students` array with database queries
3. Add connection pooling and error handling

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use:**

   ```bash
   # Change port in src/index.ts
   const port = process.env.PORT || 3002;
   ```

2. **CORS errors:**

   - Check that frontend URLs are in the CORS origins list
   - Verify the backend is running on the correct port

3. **Dependencies not found:**

   ```bash
   # Clear and reinstall
   rm -rf node_modules bun.lockb
   bun install
   ```

4. **TypeScript errors:**
   ```bash
   # Check TypeScript configuration
   bun run build
   ```

### Debug Mode

Enable debug logging by setting environment variables:

```bash
DEBUG=* bun run dev
```

## 📈 Performance

- **Hono** provides excellent performance for API endpoints
- **Bun** offers fast startup and execution
- **In-memory data** ensures instant responses
- **CORS preflight** is optimized for development

## 🔒 Security Considerations

- CORS is configured for development only
- No authentication implemented yet
- Input validation should be added for production
- Rate limiting recommended for production use

## 🚀 Production Deployment

1. **Build the application:**

   ```bash
   bun run build
   ```

2. **Set environment variables:**

   ```bash
   export PORT=8080
   export NODE_ENV=production
   ```

3. **Start production server:**
   ```bash
   bun run start
   ```

## 📚 Next Steps

- [ ] Add database integration (PostgreSQL/Supabase)
- [ ] Implement authentication middleware
- [ ] Add input validation with Zod
- [ ] Add rate limiting
- [ ] Add logging and monitoring
- [ ] Add comprehensive tests
- [ ] Add API documentation with OpenAPI/Swagger

## 🤝 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure Bun is properly installed
4. Check that the port isn't being used by another service

## 📝 Notes

- The backend runs on port 3001 by default
- Frontend should be configured to make requests to `http://localhost:3001`
- All API responses follow a consistent format with `success`, `data`, and optional fields
- The server automatically restarts when you make changes to the code
