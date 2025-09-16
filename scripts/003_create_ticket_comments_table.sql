-- Modified to work with UUID-based user system
-- Create ticket comments table for communication history
create table if not exists public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null references public.users(id),
  comment text not null,
  is_internal boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (but allow all operations for now)
alter table public.ticket_comments enable row level security;

-- RLS Policies for ticket comments - permissive for email-only auth
create policy "Allow all operations on ticket_comments" 
  on public.ticket_comments for all 
  using (true)
  with check (true);

-- Create indexes
create index if not exists ticket_comments_ticket_id_idx on public.ticket_comments(ticket_id);
create index if not exists ticket_comments_user_id_idx on public.ticket_comments(user_id);
create index if not exists ticket_comments_created_at_idx on public.ticket_comments(created_at);
