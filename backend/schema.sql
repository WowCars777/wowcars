-- Chekd Cars Admin: schema v1
create table if not exists outlets (id uuid primary key default gen_random_uuid(), name text not null, kind text, town text, status text default 'planned', manager text, opened_on date, created_at timestamptz default now());
create table if not exists staff (id uuid primary key default gen_random_uuid(), name text not null, role text, outlet_id uuid references outlets(id), phone text, active boolean default true, created_at timestamptz default now());
create table if not exists customers (id uuid primary key default gen_random_uuid(), name text not null, phone text, email text, town text, ltv numeric default 0, created_at timestamptz default now());
create table if not exists leads (id uuid primary key default gen_random_uuid(), name text not null, phone text, source text, interest text, town text, stage text default 'new', owner text, created_at timestamptz default now());
create table if not exists cars (id uuid primary key default gen_random_uuid(), make text, model text, variant text, year int, km int, fuel text, price numeric, chekd_score int, status text default 'listed', outlet_id uuid references outlets(id), created_at timestamptz default now());
create table if not exists doorstep_bookings (id uuid primary key default gen_random_uuid(), customer text, kind text, address text, slot timestamptz, captain text, status text default 'scheduled', fee numeric, created_at timestamptz default now());
create table if not exists service_jobs (id uuid primary key default gen_random_uuid(), car text, customer text, garage text, technician text, stage text default 'received', checks_pass int, checks_attention int, checks_fail int, chekd_score int, created_at timestamptz default now());
create table if not exists parts (id uuid primary key default gen_random_uuid(), sku text unique, name text, category text, stock int default 0, reorder_level int default 5, price numeric, created_at timestamptz default now());
create table if not exists part_orders (id uuid primary key default gen_random_uuid(), customer text, items text, total numeric, status text default 'placed', created_at timestamptz default now());
create table if not exists partner_leads (id uuid primary key default gen_random_uuid(), name text, phone text, town text, format text, investment text, stage text default 'enquiry', notes text, created_at timestamptz default now());
create table if not exists settings (key text primary key, value jsonb, updated_at timestamptz default now());
create table if not exists profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, role text default 'admin', created_at timestamptz default now());

do $$ declare t text; begin
  foreach t in array array['outlets','staff','customers','leads','cars','doorstep_bookings','service_jobs','parts','part_orders','partner_leads','settings','profiles'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "team_all" on %I', t);
    execute format('create policy "team_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email)) on conflict do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
