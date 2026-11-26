-- Chekd Cars: migration 002 (PROPOSED, not yet applied)
-- Aligns the live Supabase schema (v1) with the fields admin/index.html actually reads and writes.
-- Without this, every insert, update and "Load demo data" in the admin fails with
-- "column ... does not exist" (verified against the live project on 2026-11-26).
-- Additive and safe to re-run. Run in Supabase > SQL editor.

-- leads: app uses type, car, area, status, captain, date
alter table leads add column if not exists type text;
alter table leads add column if not exists car text;
alter table leads add column if not exists area text;
alter table leads add column if not exists status text default 'New';
alter table leads add column if not exists captain text;
alter table leads add column if not exists date text;

-- cars: app uses model (full name), price in lakh, score, status (Inspection/Live/Reserved/Sold)
alter table cars add column if not exists score int;
alter table cars alter column status set default 'Inspection';

-- doorstep_bookings: app uses time, type, customer, area, car, captain, status
alter table doorstep_bookings add column if not exists time text;
alter table doorstep_bookings add column if not exists type text;
alter table doorstep_bookings add column if not exists area text;
alter table doorstep_bookings add column if not exists car text;
alter table doorstep_bookings alter column status set default 'Scheduled';

-- service_jobs: app uses car, reg, customer, garage, job, est, and stage as an index 0-5
alter table service_jobs add column if not exists reg text;
alter table service_jobs add column if not exists job text;
alter table service_jobs add column if not exists est numeric;
alter table service_jobs alter column stage drop default;
alter table service_jobs alter column stage type int using (case when stage ~ '^\d+$' then stage::int else 0 end);
alter table service_jobs alter column stage set default 0;

-- staff: app uses outlet (name), jobs, rating
alter table staff add column if not exists outlet text;
alter table staff add column if not exists jobs int default 0;
alter table staff add column if not exists rating numeric;

-- parts: app uses brand, fits, qty, reorder, type
alter table parts add column if not exists brand text;
alter table parts add column if not exists fits text;
alter table parts add column if not exists qty int default 0;
alter table parts add column if not exists reorder int default 5;
alter table parts add column if not exists type text;

-- part_orders: app uses code, who, amt
alter table part_orders add column if not exists code text;
alter table part_orders add column if not exists who text;
alter table part_orders add column if not exists amt numeric;

-- outlets: app uses type, area, note, staff, cars, sales (lakh), jobs
alter table outlets add column if not exists type text;
alter table outlets add column if not exists area text;
alter table outlets add column if not exists note text;
alter table outlets add column if not exists staff int default 0;
alter table outlets add column if not exists cars int default 0;
alter table outlets add column if not exists sales numeric default 0;
alter table outlets add column if not exists jobs int default 0;

-- partner_leads: app uses type, band, source, and stage as an index 0-4
alter table partner_leads add column if not exists type text;
alter table partner_leads add column if not exists band text;
alter table partner_leads add column if not exists source text;
alter table partner_leads alter column stage drop default;
alter table partner_leads alter column stage type int using (case when stage ~ '^\d+$' then stage::int else 0 end);
alter table partner_leads alter column stage set default 0;

-- customers: app uses type, cars (array), passport, last, log (array of [date, text])
alter table customers add column if not exists type text;
alter table customers add column if not exists cars jsonb default '[]'::jsonb;
alter table customers add column if not exists passport boolean default false;
alter table customers add column if not exists last text;
alter table customers add column if not exists log jsonb default '[]'::jsonb;

notify pgrst, 'reload schema';
