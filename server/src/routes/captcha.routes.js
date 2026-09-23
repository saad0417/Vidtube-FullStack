import { Router } from 'express';
import { getCaptcha } from "../controllers/captcha.controller.js"

const router = Router();

router.route("/").get(getCaptcha);

export default router
