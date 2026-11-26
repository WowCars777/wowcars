-- Chekd Cars: migration 003 (PROPOSED, not yet applied)
-- Today every table allows ANY signed-in user full read/write, and sign-up is open
-- from the admin login page. Anyone who signs up can read all customer phone numbers.
-- This restricts access to approved team members only.
-- Also: Supabase > Authentication > Providers > Email > turn OFF "Allow new users to sign up",
-- then invite team members from the dashboard.

alter table profiles add column if not exists approved boolean default false;
-- role values: 'Super Admin', 'Outlet Manager', 'Chekd Captain', 'Technician'
alter table profiles alter column role set default 'Chekd Captain';

create or replace function public.is_team() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and approved);
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and approved and role = 'Super Admin');
$$;

do $$ declare t text; begin
  foreach t in array array['outlets','staff','customers','leads','cars','doorstep_bookings','service_jobs','parts','part_orders','partner_leads'] loop
    execute format('drop policy if exists "team_all" on %I', t);
    execute format('create policy "team_all" on %I for all to authenticated using (public.is_team()) with check (public.is_team())', t);
  end loop;
end $$;

-- settings: everyone on the team reads, only Super Admin writes
drop policy if exists "team_all" on settings;
create policy "settings_read" on settings for select to authenticated using (public.is_team());
create policy "settings_write" on settings for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- profiles: each user reads their own; Super Admin manages everyone
drop policy if exists "team_all" on profiles;
create policy "profiles_self" on profiles for select to authenticated using (id = auth.uid() or public.is_super_admin());
create policy "profiles_admin" on profiles for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- Approve the first owner by hand, e.g.:
-- update profiles set approved = true, role = 'Super Admin' where id = (select id from auth.users where email = 'owner@example.com');

-- Public web-app forms: allow anonymous INSERT only (no read) into leads and partner_leads
create policy "public_lead_insert" on leads for insert to anon with check (status = 'New');
create policy "public_partner_insert" on partner_leads for insert to anon with check (stage = 0);
