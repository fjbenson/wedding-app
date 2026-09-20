# Data access layer

Every database query in the app goes through this folder. Nothing else imports
the Supabase client directly.

Two reasons:

1. **One place to look.** If a query is wrong or slow, it's in here.
2. **It keeps hosting reversible.** If the app ever outgrows Next.js and needs a
   separate backend service, this folder is what moves. The screens calling it
   don't change.

Row-level security in Postgres is what actually enforces who can see what — these
functions assume the caller is signed in and let the database decide.
