-- Modified to work with UUID-based user system instead of auth.users
-- Create tickets table
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  priority text not null check (priority in ('Baja', 'Media', 'Alta', 'Urgente')),
  status text not null check (status in ('Abierto', 'En Progreso', 'Resuelto', 'Cerrado')),
  category text not null,
  assigned_to uuid references public.users(id),
  created_by uuid not null references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  resolution_notes text
);

-- Enable Row Level Security (but allow all operations for now)
alter table public.tickets enable row level security;

-- RLS Policies for tickets table - permissive for email-only auth
create policy "Allow all operations on tickets" 
  on public.tickets for all 
  using (true)
  with check (true);

-- Create updated_at trigger for tickets
create trigger tickets_updated_at
  before update on public.tickets
  for each row
  execute function public.handle_updated_at();

-- Create indexes for better performance
create index if not exists tickets_status_idx on public.tickets(status);
create index if not exists tickets_priority_idx on public.tickets(priority);
create index if not exists tickets_assigned_to_idx on public.tickets(assigned_to);
create index if not exists tickets_created_by_idx on public.tickets(created_by);
create index if not exists tickets_created_at_idx on public.tickets(created_at);
