import express from 'express';
import { authGetController, loginPostController, registerController, verifyEmailController } from '../controllers/authControllers.js';
import { userAuth } from '../middlewares/authMiddleware.js';

const router = express.Router()


//routes
router.get('/', authGetController);

//REGISTER || POST
router.post('/register', registerController);

// LOGIN || POST
router.post('/login', loginPostController);

// VERIFY || POST
router.post('/verify-email', userAuth, verifyEmailController);

export default router;