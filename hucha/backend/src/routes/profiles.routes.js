import { Router } from 'express';
import { asyncH, HttpError } from '../middleware/errors.js';
import * as profiles from '../services/profiles.service.js';
import * as tags from '../services/tags.service.js';
import * as txns from '../services/transactions.service.js';
import * as dashboard from '../services/dashboard.service.js';
import * as goals from '../services/goals.service.js';
import * as inbox from '../services/inbox.service.js';
import * as recurring from '../services/recurring.service.js';

const router = Router();

router.get('/', asyncH(async (req, res) => res.json(await profiles.listProfiles())));

// Everything below is profile-scoped: /api/profiles/:profileId/…
// Switching profiles in the UI only changes this one path segment.
router.use('/:profileId', (req, res, next) => {
  const id = Number(req.params.profileId);
  if (!Number.isInteger(id) || id <= 0) return next(new HttpError(400, 'Invalid profile id'));
  req.profileId = id;
  next();
});

router.get('/:profileId/accounts', asyncH(async (req, res) =>
  res.json(await profiles.listAccounts(req.profileId))));

router.get('/:profileId/tags', asyncH(async (req, res) =>
  res.json(await tags.listTags(req.profileId))));

router.get('/:profileId/dashboard', asyncH(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;
  res.json(await dashboard.getDashboard(req.profileId, year, month));
}));

router.get('/:profileId/transactions', asyncH(async (req, res) =>
  res.json(await txns.listTransactions(req.profileId, req.query))));

router.get('/:profileId/recurring', asyncH(async (req, res) =>
  res.json(await recurring.listRules(req.profileId))));

router.get('/:profileId/inbox', asyncH(async (req, res) =>
  res.json(await inbox.listPending(req.profileId))));

router.get('/:profileId/inbox/count', asyncH(async (req, res) =>
  res.json({ count: await inbox.countPending(req.profileId) })));

router.get('/:profileId/goals', asyncH(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  res.json(await goals.getGoals(req.profileId, year));
}));

router.put('/:profileId/goals', asyncH(async (req, res) =>
  res.json(await goals.upsertGoal(req.profileId, req.body))));

export default router;
