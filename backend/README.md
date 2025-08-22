# TeachMe.ai Backend

A fast, modern backend API built with Hono and Bun for the TeachMe.ai educational platform.

## Features

- 🚀 **Fast**: Built with Hono for high performance
- 🍃 **Lightweight**: Minimal dependencies and bundle size
- 🔒 **Type Safe**: Full TypeScript support
- 🌐 **CORS Enabled**: Ready for frontend integration
- 📊 **Student Management**: Complete student data API
- 🔍 **Search & Filter**: Advanced student search capabilities

## API Endpoints

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/search?q=query` - Search students
- `GET /api/students/:id/progress` - Get student progress

### Courses
- `GET /api/courses/:courseId/students` - Get students by course

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) installed on your system

### Installation
```bash
cd backend
bun install
```

### Development
```bash
bun run dev
```

### Production
```bash
bun run start
```

### Build
```bash
bun run build
```

## Development

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable.

### File Structure
```
backend/
├── src/
│   └── index.ts          # Main server file
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Adding New Endpoints

1. Open `src/index.ts`
2. Add new routes using Hono's routing methods
3. Follow the existing pattern for consistent API responses

Example:
```typescript
app.get('/api/new-endpoint', (c) => {
  return c.json({
    success: true,
    data: { message: 'Hello World' }
  });
});
```

## API Response Format

All API responses follow a consistent format:

```typescript
{
  success: boolean,
  data?: any,
  count?: number,
  message?: string
}
```

## CORS Configuration

The API is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Common React dev server)

You can modify the CORS origins in `src/index.ts` if needed.

## Next Steps

- [ ] Add database integration (PostgreSQL/Supabase)
- [ ] Implement authentication middleware
- [ ] Add input validation with Zod
- [ ] Add rate limiting
- [ ] Add logging and monitoring
- [ ] Add tests with Bun test
