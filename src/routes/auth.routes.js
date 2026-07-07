const express = require('express');
const { userRegisterController, userLoginController,
    userLogoutController } = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const authRouter = express.Router();

/* POST /api/v1/auth/register */
authRouter.post("/register", userRegisterController);

/* POST /api/v1/auth/login */
authRouter.post("/login", userLoginController);

/**
 * - POST /api/auth/logout
 */
authRouter.post('/logout', userLogoutController)

module.exports = authRouter;