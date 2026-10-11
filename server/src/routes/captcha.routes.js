import { Router } from 'express';
import { getCaptcha } from "../controllers/captcha.controller.js"
import { captchaLimiter } from "../middlewares/rateLimit.middleware.js"

const router = Router();

router.route("/").get(captchaLimiter, getCaptcha);

export default router
