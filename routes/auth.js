import express from 'express';
import { register, login } from '../controllers/authController.js';
import getLocationFromIp from '../utils/getGeoLocation.js';

const router = express.Router();

// If you need to use IP-based location, do it inside a route
router.post('/register', async (req, res, next) => {
  try {
    const ip = req.ip;
    const location = await getLocationFromIp(ip);
    // You can pass location to your controller or use it here
    await register(req, res, location);
  } catch (err) {
    next(err);
  }
});

router.post('/login', login);

export default router;