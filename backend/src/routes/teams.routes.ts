import {Router} from 'express';
import {getTeams} from "../controllers/teams.controller.js";

const router = Router();
router.get('/teams', getTeams);
export default router;
