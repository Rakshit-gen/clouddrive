import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { env } from './env';

const PgSession = connectPgSimple(session);

// ponytail: session store swaps to in-memory for tests so the suite runs without a live Postgres instance.
const store =
  env.NODE_ENV === 'test'
    ? undefined
    : new PgSession({
        pool: new Pool({ connectionString: env.DATABASE_URL }),
        tableName: 'session',
        createTableIfMissing: true,
      });

export const sessionMiddleware = session({
  store,
  name: 'clouddrive.sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
});
