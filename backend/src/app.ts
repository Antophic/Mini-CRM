import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { csrfMiddleware } from "./middlewares/csrf.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { apiRoutes } from "./routes/index.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: env.CORS_ORIGIN,
  }),
);
app.use(
  rateLimit({
    legacyHeaders: false,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  }),
);
app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
app.use(cookieParser());
app.use(csrfMiddleware);

app.use("/api", apiRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
