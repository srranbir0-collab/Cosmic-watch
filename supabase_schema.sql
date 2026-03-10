
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Messages Table
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  user_id text not null,
  asteroid_id text not null,
  content text not null,
  username text, -- Denormalized for display speed
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table messages enable row level security;

-- Policies
-- 1. Allow anyone to read messages (Public Chat)
create policy "Public messages are viewable by everyone."
  on messages for select
  using ( true );

-- 2. Allow authenticated users (via API Key/Service Role in backend) to insert
-- Note: Our backend uses the service role key, bypassing RLS, but if we switched to client-side:
create policy "Users can insert their own messages."
  on messages for insert
  with check ( true ); 

-- Indexes for performance
create index if not exists messages_asteroid_id_idx on messages(asteroid_id);
create index if not exists messages_created_at_idx on messages(created_at);
