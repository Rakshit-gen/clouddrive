import { Router } from 'express';
import passport from './passport';
import { env } from '../../config/env';

const router = Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  (_req, res) => {
    res.redirect(env.FRONTEND_URL);
  },
);

router.get('/me', (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    res.json({ user: null });
    return;
  }
  const { id, email, name, avatarUrl } = req.user;
  res.json({ user: { id, email, name, avatarUrl } });
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      next(err);
      return;
    }
    req.session.destroy(() => {
      res.clearCookie('clouddrive.sid');
      res.status(204).send();
    });
  });
});

export default router;
