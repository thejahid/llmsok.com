# Supabase Authentication Setup

## Overview

LLM.txt Mastery now uses Supabase for authentication and user management. This provides secure user accounts with email/password authentication and proper session management.

## Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Environment Variables
Update your `.env` file with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup
Run the migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase/migrations/001_create_user_profiles.sql
```

This creates:
- `user_profiles` table with tier information
- Row Level Security (RLS) policies
- Automatic user profile creation on signup
- Proper indexes for performance

### 4. Authentication Configuration
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Enable email confirmations (recommended)
3. Set up your email templates
4. Configure allowed domains if needed

## Architecture

### Server-Side Authentication
- **Middleware**: `server/middleware/auth.ts`
  - `requireAuth`: Protects routes requiring authentication
  - `optionalAuth`: Adds user info if authenticated
  - `requireTier`: Enforces tier-based access

- **Auth Routes**: `server/routes/auth.ts`
  - `POST /api/auth/signup` - User registration
  - `POST /api/auth/signin` - User login
  - `POST /api/auth/signout` - User logout
  - `GET /api/auth/me` - Get current user
  - `PATCH /api/auth/me/tier` - Update user tier

### Client-Side Authentication
- **Context**: `client/src/contexts/AuthContext.tsx`
  - Manages authentication state
  - Provides auth functions to components
  - Handles user profile data

- **Components**: `client/src/components/auth/`
  - `AuthModal.tsx` - Unified login/signup modal
  - `LoginForm.tsx` - Login form component
  - `SignupForm.tsx` - Registration form component
  - `ProtectedRoute.tsx` - Route protection wrapper

## Usage

### Protecting Routes
```typescript
// Require authentication
app.post("/api/analyze", requireAuth, async (req, res) => {
  // req.user contains authenticated user info
  const { id, email, tier } = req.user;
});

// Require specific tier
app.get("/api/premium-feature", requireAuth, requireTier('growth'), async (req, res) => {
  // Only growth and scale users can access
});
```

### Client-Side Usage
```typescript
// In React components
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginForm />;
  
  return <AuthenticatedContent />;
}
```

### Protected Routes
```typescript
// Wrap components that need authentication
<ProtectedRoute>
  <AnalysisPage />
</ProtectedRoute>
```

## User Tiers

The system supports three tiers:
- **starter**: Free tier with basic features
- **growth**: Paid tier with enhanced features
- **scale**: Enterprise tier with full access

User tiers are stored in the `user_profiles` table and automatically available in `req.user.tier`.

## Security Features

1. **JWT Tokens**: Secure session management via Supabase
2. **Row Level Security**: Database-level access control
3. **Email Verification**: Optional email confirmation
4. **Automatic Profile Creation**: User profiles created on signup
5. **Tier-Based Access**: Route-level tier enforcement

## Migration from Email Capture

The existing email capture system can work alongside authentication:
- Unauthenticated users can still try the system
- Email capture creates a guest session
- Users can upgrade to full accounts later

## Testing

To test authentication:
1. Start the server with Supabase credentials
2. Go to http://localhost:3000
3. Try the signup/login flow
4. Test protected routes with authentication headers

## Troubleshooting

Common issues:
- **Invalid credentials**: Check SUPABASE_URL and SUPABASE_ANON_KEY
- **Database errors**: Ensure migration was run in Supabase
- **CORS issues**: Configure allowed origins in Supabase settings
- **Email not sending**: Check email configuration in Supabase dashboard