# Chekd Cars

Every car, checked. Buy, sell, service and parts for pre-owned cars, starting in Bengaluru.

| Folder | What it is |
|---|---|
| `web-app/` | Public website (static HTML/CSS/JS, no build step) |
| `admin/` | Team admin panel. Talks to Supabase with the publishable key; session in memory |
| `backend/schema.sql` | Supabase/Postgres schema v1 (12 tables, RLS, profiles trigger) |
| `backend/migrations/` | Proposed migrations: 002 aligns the schema with the admin, 003 locks down access |

Supabase project: `https://yjxwiibpcuukucwvlkwq.supabase.co`

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/web-app/ and http://localhost:8000/admin/
```

## Live (GitHub Pages)

- Site: https://wowcars777.github.io/wowcars/web-app/
- Admin: https://wowcars777.github.io/wowcars/admin/

See [REVIEW.md](REVIEW.md) for the code review and roadmap. Photos are AI-generated brand visuals; demo figures are invented.
