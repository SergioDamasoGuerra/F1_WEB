import {Router} from 'express';
import {getDriverStandingsByEvent, getTeamStandingsByEvent} from "../controllers/standings.controller.js";

const router: Router = Router();

router.get('/standings/drivers', getDriverStandingsByEvent);
router.get('/standings/teams', getTeamStandingsByEvent);

export default router;
