-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Reset/Clean (Using CASCADE to force delete dependent policies)
drop table if exists public.user_metal_access cascade;
drop table if exists public.metals cascade;
drop table if exists public.profiles cascade;

-- 2. Create Tables
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user',
  name text
);

create table public.metals (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  rate numeric,
  type text, -- 'precious', 'industrial', etc.
  change numeric -- 24h change
);

create table public.user_metal_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  metal_id uuid references public.metals(id) not null,
  assigned_at timestamptz default now(),
  unique(user_id, metal_id)
);

create table public.metal_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  metal_id uuid references public.metals(id) not null,
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  requested_at timestamptz default now(),
  unique(user_id, metal_id) -- Prevent duplicate pending requests for same metal
);

-- 3. Enable Security (RLS)
alter table public.profiles enable row level security;
alter table public.metals enable row level security;
alter table public.user_metal_access enable row level security;
alter table public.metal_requests enable row level security;

-- 4. RLS Policies (Permissions)

-- Profiles
create policy "Users can read own profile" 
  on profiles for select 
  to authenticated 
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check ( auth.uid() = id );

create policy "Admins can read all profiles" 
  on profiles for select 
  to authenticated 
  using ( (select role from profiles where id = auth.uid()) = 'admin' );

create policy "Admins can insert/update profiles" 
  on profiles for all
  to authenticated 
  using ( (select role from profiles where id = auth.uid()) = 'admin' )
  with check ( (select role from profiles where id = auth.uid()) = 'admin' );

-- Metals
create policy "Everyone can read metals" 
  on metals for select 
  to authenticated 
  using ( true );

create policy "Admins can manage metals" 
  on metals for all 
  to authenticated 
  using ( (select role from profiles where id = auth.uid()) = 'admin' );

-- Access
create policy "Users can see own assignments" 
  on user_metal_access for select 
  to authenticated 
  using ( auth.uid() = user_id );

create policy "Admins can manage assignments" 
  on user_metal_access for all 
  to authenticated 
  using ( (select role from profiles where id = auth.uid()) = 'admin' );

-- Requests
create policy "Users can see own requests" 
  on metal_requests for select 
  to authenticated 
  using ( auth.uid() = user_id );

create policy "Users can create requests" 
  on metal_requests for insert 
  to authenticated 
  with check ( auth.uid() = user_id );

create policy "Admins can manage all requests" 
  on metal_requests for all 
  to authenticated 
  using ( (select role from profiles where id = auth.uid()) = 'admin' );


-- 5. Seed Data (Initial Metals)
insert into metals (name, rate, type, change) values
('Gold', 1950.50, 'precious', 1.2),
('Silver', 24.80, 'precious', -0.5),
('Platinum', 980.00, 'precious', 0.8),
('Copper', 3.85, 'industrial', 0.1),
('Aluminum', 1.10, 'industrial', -0.2);

-- 6. Automatic Profile Trigger (Recommended)
-- This automatically creates a profile record when a user signs up in Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, name)
  values (new.id, new.email, 'user', split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- IMPORTANT MANUAL STEP REMINDER:
-- 1. Run this entire script in your Supabase SQL Editor.
-- 2. Your admin account is force-configured in AuthContext.jsx for 'sreehari@gmail.com'.
-- 3. To make other users admins, update their role manually in the profiles table.
