import { Router } from "express"
import { AuthMiddleware } from "../middlewares/AuthMiddleware"
import { AuthController } from "../controllers/AuthController"

const router = Router();
const authMiddleware = new AuthMiddleware()
const controller = new AuthController()

router.post("/login", controller.login)
router.get("/me/user", authMiddleware.authenticateToken, controller.meUser)
router.get("/me/pro", authMiddleware.authenticateToken, controller.meProfessional)
router.post("/logout", authMiddleware.authenticateToken, controller.logout)

export default router;