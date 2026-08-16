import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'F1 Backend running correctly',
        timestamp: new Date().toISOString()
    });
})

export default router;