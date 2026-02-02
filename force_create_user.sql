-- ==========================================
-- EMERGENCY USER CREATION SCRIPT
-- Run this if the Frontend Register/Sign-up fails.
-- This bypasses the API and inserts directly into auth.users.
-- ==========================================

-- 1. Enable pgcrypto for password hashing if not already on
create extension if not exists pgcrypto;

-- 2. Insert the user 'arun@gmail.com' with password 'password123'
-- We also auto-confirm the email so they can login immediately.
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'arun@gmail.com',
  crypt('password123', gen_salt('bf')), -- Password is 'password123'
  now(), -- Email confirmed immediately
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 3. (Optional) Make this user an Admin?
-- Run this AFTER the insert above succeeds.
-- INSERT INTO public.profiles (id, email, role)
-- SELECT id, email, 'admin' FROM auth.users WHERE email = 'arun@gmail.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
