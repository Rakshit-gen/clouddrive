import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import * as filesController from './files.controller';

const router = Router();

router.use(requireAuth);

router.get('/', filesController.list);
router.get('/search', filesController.search);
router.get('/shared', filesController.sharedWithMe);
router.get('/storage', filesController.storageUsage);
router.post('/upload-url', filesController.createUploadUrl);
router.post('/complete', filesController.completeUpload);
router.get('/:id', filesController.getById);
router.get('/:id/download', filesController.download);
router.patch('/:id', filesController.rename);
router.delete('/:id', filesController.remove);
router.post('/:id/share', filesController.share);

export default router;
