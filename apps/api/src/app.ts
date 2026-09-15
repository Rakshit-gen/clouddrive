import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { sessionMiddleware } from './config/session';
import passport from './modules/auth/passport';
import authRoutes from './modules/auth/auth.routes';
import filesRoutes from './modules/files/files.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  // ponytail: tighter than the general limiter — OAuth handshakes and presigned-upload
  // requests are the two endpoints where a script could rack up real cost (Google API
  // quota, S3 storage) faster than plain request volume would suggest.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);
  app.use('/auth', authLimiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/auth', authRoutes);
  app.use('/api/files/upload-url', uploadLimiter);
  app.use('/api/files', filesRoutes);

  if (env.NODE_ENV === 'test') {
    // Test-only helper to establish a session without running the real Google OAuth flow.
    app.post('/test/login', (req, res, next) => {
      req.login(req.body.user, (err) => {
        if (err) {
          next(err);
          return;
        }
        res.status(204).send();
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
