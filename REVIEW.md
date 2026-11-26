# Chekd Cars: code review and roadmap (2026-11-26)

Scope: `web-app/` (public site, 1,672 lines), `admin/` (Supabase admin, 1,272 lines, ~83 KB inline JS), `backend/schema.sql` (v1).
The live Supabase project was probed read-only with the publishable key.

## Status (updated 2026-11-26)

Done in code:
- Admin: table names fixed (`doorstep_bookings`, `service_jobs`); rows ordered by `created_at`; every rendered field escaped; role read from `profiles` (v1 `admin` = Super Admin, anything else unknown = Chekd Captain) and the nav hides modules the role can't open; role picker and "Create account" removed from login; session survives a refresh (tab-scoped); add-car year limit follows the calendar; outlet and Captain dropdowns come from real data.
- Public site: all five forms now save to Supabase (`leads`, `partner_leads`). If the save fails, the visitor gets a prefilled WhatsApp link so no lead is lost. Name and phone added to the Doorstep and Sell forms. Privacy Policy and Terms pages (drafts) with consent lines on forms. Mobile layout fixes.

Still needs the owner (Supabase dashboard):
1. SQL editor: run `backend/migrations/002_align_admin_schema.sql`, then `003_lock_down_access.sql`.
2. Approve yourself: `update profiles set approved = true, role = 'Super Admin' where id = (select id from auth.users where email = 'YOUR EMAIL');`
3. Authentication > Sign In / Providers > Email: turn off "Allow new users to sign up". Invite staff from Authentication > Users.
4. Authentication > URL Configuration: set Site URL to `https://wowcars777.github.io/wowcars/admin/` so reset links land on the admin.

Until step 1 runs, public forms fall back to WhatsApp and admin saves still fail.

## Verdict

The front end is polished: strong brand, responsive, accessible (aria labels, focus handling, reduced motion), clean vanilla JS with no build step.
The product behind it is not wired yet. The public site captures nothing, and the admin cannot write to the database it points at.

## Critical (blocks launch)

1. **Admin and database disagree, so every write fails.**
   - `TABLES` maps Doorstep to `doorstep` and Service to `service`; the live tables are `doorstep_bookings` and `service_jobs` (PGRST205 "table not found").
   - The app reads and writes columns the schema doesn't have: `leads.type/car/area/status/captain`, `cars.score`, `parts.qty/brand/fits/reorder/type`, `outlets.type/area/staff/cars/sales/jobs`, `customers.type/cars/passport/log`, and more (verified: Postgres 42703 "column does not exist").
   - `service_jobs.stage` and `partner_leads.stage` are text in the DB but used as numbers in JS (`stage + 1` would give "01").
   - Fix: run `backend/migrations/002_align_admin_schema.sql`, and change `TABLES` to `tasks: "doorstep_bookings", jobs: "service_jobs"`.
2. **Anyone can become an admin.** Sign-up is open on the login page, RLS is `using (true)` for every authenticated user, and the role (Super Admin / Captain) is picked from a dropdown on the login form. Role permissions in Settings are UI only. Once data is real, any stranger who signs up can read every customer's phone number.
   - Fix: disable public sign-up, run `003_lock_down_access.sql`, read the role from `profiles` instead of the login form, and hide nav items the role can't open.
3. **Public forms go nowhere.** Doorstep booking, Sell, Service, Passport and Partner forms all show "success" but send nothing (`.x-js-form` only disables inputs). Every lead is lost.
   - Fix: POST to Supabase `leads` / `partner_leads` with the anon insert-only policies in migration 003, plus a WhatsApp click-to-chat fallback.

## Important

4. **Stored XSS.** Several fields render without `esc()`: `l.type`, `l.source`, `l.town`, `l.phone`, `l.date`, `c.phone`, `c.town`, `c.last`, `o.type`, `o.note`, `p.type`, `p.band`, `p.source`, `j.reg`, `j.garage`, `s.role`, `s.outlet`, `t.type`. Combined with open sign-up this is exploitable. Escape everything.
5. **Ordering by uuid.** `loadAll` sorts with `order=id.asc`; ids are random uuids, so lists shuffle. Use `order=created_at.desc`.
6. **Hard-coded data drifts from the DB.** `OUTLETS` (Koramangala, Whitefield) and `S.captains` are constants while the outlets data says HSR Layout. Derive dropdowns from `S.outlets` and `S.staff`.
7. **Dates.** Add-car `max="2025"` rejects 2026 cars. Doorstep "time" has no date, so "Today's Doorstep" shows every booking ever. Store a real `slot timestamptz` and filter by today.
8. **Session is memory-only.** A page refresh logs the user out. Persist the refresh token in `sessionStorage` (or use supabase-js).
9. **Duplicate assets.** `chart.js` (208 KB) and the hark-* CSS/JS are copied into both folders; move to a shared `assets/` folder.
10. **Dashboard and Reports charts are fixed sample numbers** (sold-data, report-data JSON). Replace with queries over `cars`, `leads`, `part_orders`, `service_jobs`.

## Public web app gaps

- 38 car cards are hard-coded HTML. Load listings from `cars` where `status = 'Live'`, with a detail page per car (photos, 200-point report, EMI, book test drive).
- Parts cart is a counter only: no cart drawer, checkout, or payment.
- No privacy policy or terms page (required before collecting phone numbers under India's DPDP Act 2023), no Open Graph tags, no sitemap or robots.txt, no analytics.

## Suggested roadmap

**Sprint 1 (launch-blocking, ~1 week)**
1. Run migrations 002 and 003; fix the `TABLES` names; disable public sign-up.
2. Role from `profiles`, nav filtered by role; escape all rendered fields.
3. Wire every public form to Supabase (anon insert only) and show leads in admin in real time.
4. Privacy policy and terms pages; consent checkbox on forms.

**Sprint 2 (make it a real marketplace, ~2 to 3 weeks)**
5. Live inventory on the public site from `cars`, with car detail pages and photo upload to Supabase Storage from admin.
6. Chekd Check: a real 200-point inspection form for technicians (mobile-first), producing the ChekdScore and a shareable PDF report.
7. Doorstep scheduling with real dates, slot capacity per Captain, and WhatsApp confirmations (WhatsApp Cloud API or Interakt / Gupshup).
8. Dashboard and Reports from real queries.

**Sprint 3 (revenue)**
9. Parts checkout with Razorpay (UPI, cards), GST invoices, order tracking.
10. Chekd Passport: per-car public history page by registration number, with QR code.
11. Sell-car instant quote using a pricing model (make, model, year, km, town), then book an inspection.
12. Finance and insurance lead hand-off (EMI calculator is already there).

**Later**
- Multi-town franchise portal (partners see only their outlet: RLS by `outlet_id`).
- Captain mobile PWA (today's jobs, navigation, photo capture, status updates offline).
- Move to a small framework (Astro or Next.js) once pages multiply, for routing, SEO and shared components.
