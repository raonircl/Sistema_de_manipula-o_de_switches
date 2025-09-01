import express from 'express';
import vlanController from '../controller/vlanController.mjs';

const router = express.Router();

router.use('/vlan', vlanController);

export default router;