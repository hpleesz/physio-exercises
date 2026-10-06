# Physio exercise library

A searchable library of physio exercises. React (Vite) frontend on GitHub Pages, data in Supabase.

## Settings

Everything you normally change is in **`src/config.js`**: Supabase URL and key, page title,
which filter buttons to show, table columns, colours of list values, and the search words for "and" / "or".

## Publishing

1. In the GitHub repo: **Settings > Pages > Source: GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes the site.
   Progress is visible under the repo's **Actions** tab.

## Running on your own computer (optional)

Requires Node.js 20 or newer.

    npm install
    npm run dev

## Search

- `knee band` – both words
- `knee or hip` – either word (`vagy` and `|` also work)
- `"medence billent"` – exact phrase
- `#12` – exactly exercise 12
- Accents are ignored: `osszeszorit` finds "összeszorít"

## Database scripts (`sql/`)

1. `1-schema.sql` – creates everything on a fresh project (**deletes existing data**)
2. `2-check-import.sql` – after importing a CSV into `exercises_import`, lists typos
3. `3-copy-import.sql` – moves the import into `exercises`
4. `4-link-drawings.sql` – links uploaded drawings by exercise number
5. `5-equipment-alternatives.sql` – run once on an existing database so equipment can hold
   alternatives (not needed after a fresh `1-schema.sql`)

## Equipment

Separate what an exercise needs with commas, and alternatives with `/`:

- `Resistance band, Chair` – needs both
- `Mat/Bed, Exercise ball` – needs a mat or a bed, and an exercise ball

The Equipment filter in the table shows an exercise when you have something for every need.
