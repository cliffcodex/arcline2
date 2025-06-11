import express from 'express';
import { register, login } from '../controllers/authController.js';
import getLocationFromIp from '../utils/getGeoLocation.js';

const router = express.Router();

// Register Route
router.post('/register', async (req, res, next) => {
  try {
    // Get the user's IP address
    const ip = req.ip;

    // Attempt to get location based on IP
    let location = 'Unknown';
    try {
      location = await getLocationFromIp(ip);  // Assuming this function returns location info
    } catch (error) {
      console.error('Error getting location from IP:', error.message);
    }

    // Pass location to register controller
    await register(req, res, location);

  } catch (err) {
    next(err); // Propagate errors to the error handler
  }
});

// Login Route
router.post('/login', login);

export default router;
