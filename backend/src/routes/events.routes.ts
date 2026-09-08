import {Router} from 'express';
import {getEvents, getEventWithNeighbors, getLatestSeason, getAllSeasonYears} from '../controllers/events.controller.js'

const router = Router();
router.get('/events', getEvents);
router.get('/events/neighbors', getEventWithNeighbors);
router.get('/events/latest-season', getLatestSeason);
router.get('/events/season-years', getAllSeasonYears);
export default router;

