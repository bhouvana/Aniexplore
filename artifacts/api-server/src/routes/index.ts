import { Router, type IRouter } from "express";
import healthRouter from "./health";
import animeRouter from "./anime";
import mangaRouter from "./manga";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/anime", animeRouter);
router.use("/manga", mangaRouter);

export default router;
