-- Kør dette i Supabase -> SQL Editor.
-- Det gør spiller- og kampdata tilgængelige for brugere, der er logget ind.

alter table public.users enable row level security;
alter table public.games_database enable row level security;

create policy "Authenticated users can read players"
on public.users
for select
to authenticated
using (true);

create policy "Authenticated users can read games"
on public.games_database
for select
to authenticated
using (true);

create policy "Authenticated users can insert games"
on public.games_database
for insert
to authenticated
with check (true);
