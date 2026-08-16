import {Router} from 'express';
import {getDrivers} from "../controllers/drivers.controller.js";

const router = Router();
router.get('/drivers', getDrivers);
export default router;
