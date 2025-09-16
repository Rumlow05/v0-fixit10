-- Modified to work without Supabase auth, using email-only system
-- Create users table for profile information
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null check (role in ('admin', 'level1', 'level2', 'user')),
  department text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (but allow all operations for now)
alter table public.users enable row level security;

-- RLS Policies for users table - permissive for email-only auth
create policy "Allow all operations on users" 
  on public.users for all 
  using (true)
  with check (true);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();
