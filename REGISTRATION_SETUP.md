# User Registration Setup Guide

## Overview
This guide explains how user registration works and what you need to configure in Supabase.

## How Registration Works Now

When a user clicks "Register" with their email and password:

1. **Frontend** (`Register.jsx`):
   - User enters email and password
   - Form calls `signup(email, password)` from AuthContext

2. **AuthContext** (`AuthContext.jsx`):
   - Creates user in Supabase Auth using `supabase.auth.signUp()`
   - Automatically creates a profile entry in the `profiles` table
   - Sets default role as `'user'`
   - Uses email prefix as the default name

3. **Database**:
   - User is stored in `auth.users` (Supabase Auth)
   - Profile is stored in `public.profiles` table

## Two Implementation Options

### Option 1: Application-Level (Already Implemented ✅)
The `signup` function in `AuthContext.jsx` now automatically creates the profile entry after successful registration. This is already working!

### Option 2: Database Trigger (Recommended for Production)
Run the `auto_create_profile_trigger.sql` file in Supabase SQL Editor. This creates a database trigger that automatically creates profiles whenever a user signs up.

**Advantages:**
- More reliable (works even if signup is done outside your app)
- Cleaner code
- Guaranteed consistency

**To implement:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `auto_create_profile_trigger.sql`
3. Click "Run"

## Important Supabase Settings

### Disable Email Confirmation (For Development)
By default, Supabase requires email confirmation. To allow immediate login after registration:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll to **Email Confirmation**
4. **Uncheck** "Enable email confirmations"
5. Click **Save**

### For Production
Keep email confirmation enabled and update the signup flow to show a "Check your email" message.

## Testing the Registration Flow

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:5173/register`
3. Enter email and password
4. Click "Register Now"
5. User should be:
   - Created in Supabase Auth
   - Profile created in `profiles` table with role='user'
   - Redirected to login page
6. Login with the same credentials
7. Should be redirected to `/user` dashboard

## Verify in Supabase Dashboard

After registration, check:
1. **Authentication** → **Users** - New user should appear
2. **Table Editor** → **profiles** - New profile entry should exist with:
   - `id`: matches user ID from auth
   - `email`: user's email
   - `role`: 'user'
   - `name`: email prefix or custom name

## Default User Role

All new registrations get `role='user'` by default. To make someone an admin:

1. Go to Supabase Dashboard → **Table Editor** → **profiles**
2. Find the user's row
3. Edit the `role` column to `'admin'`
4. Save

Or run SQL:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

## Troubleshooting

### "Profile not found" error after registration
- Make sure the trigger is installed OR the application-level profile creation is working
- Check Supabase logs for errors
- Verify RLS policies allow profile insertion

### Can't login immediately after registration
- Disable email confirmation in Supabase settings (see above)
- Or implement email confirmation flow

### Permission errors
- Run the GRANT statements in `auto_create_profile_trigger.sql`
- Check RLS policies in `supabase_setup.sql`
