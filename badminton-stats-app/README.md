# Badminton Stats

Next.js frontend til en Supabase-backend med:

- Supabase email/password login
- Home page med navigation
- Indtastning af badmintonkampe
- Gemning af sæt i `games_database`
- Statistik via Supabase Edge Function `badminton-stats`
- Automatisk sæsonvalg ud fra `date`

## 1. Forventet Supabase-schema

### `users`

- `id`
- `name`

### `games_database`

- `match_id`
- `set_number`
- `player_1`
- `player_1_score`
- `player_2`
- `player_2_score`
- `date`

Hvis din kolonne **bogstaveligt** hedder `match id` med mellemrum, så ændr `MATCH_ID_COLUMN` i `lib/app-config.ts`. Det anbefales dog at bruge `match_id`.

Som standard forventer frontenden, at `player_1` og `player_2` gemmer spillernavne. Hvis de i stedet gemmer `users.id`, så ændr:

```ts
export const PLAYER_STORAGE_MODE: "name" | "id" = "id";
```

i `lib/app-config.ts`.

## 2. Supabase Auth

I Supabase:

1. Gå til **Authentication -> Users**.
2. Opret de brugere, der skal kunne logge ind.
3. Login på websiden bruger disse Auth-brugere. Det er separat fra tabellen `public.users`, som bruges som spillerliste.

## 3. RLS policies

Åbn Supabase **SQL Editor** og kør indholdet af:

`supabase/policies.sql`

Hvis policies med samme navne allerede findes, skal du ikke oprette dubletter.

## 4. Edge Function

Repoet indeholder:

`supabase/functions/badminton-stats/index.ts`

Hvis du allerede har oprettet functionen i Supabase Dashboard, kan du kopiere denne kode ind dér.

Functionen er lavet til loggede brugere og `verify_jwt = true`.

## 5. Environment variables

Kopiér `.env.example` til `.env.local`:

```bash
cp .env.example .env.local
```

Udfyld:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Brug **ikke** service-role/secret key i frontend.

## 6. Kør lokalt

```bash
npm install
npm run dev
```

Åbn `http://localhost:3000`.

## 7. GitHub

Upload alle filer i denne mappe til et nyt GitHub repository.

`.env.local` skal ikke uploades. Den er allerede dækket af `.gitignore`.

## 8. Vercel

1. Importér GitHub-repoet i Vercel.
2. Vercel genkender automatisk Next.js.
3. Tilføj disse Environment Variables i Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy.

## Flow

```text
Login
  -> Home
     -> Indtast kamp -> games_database
     -> Statistik -> badminton-stats Edge Function -> dashboard
```
