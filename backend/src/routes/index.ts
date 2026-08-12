import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authRoutes } from "./auth.routes.js";
import { clientRoutes } from "./client.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { pipelineRoutes } from "./pipeline.routes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => {
  res.json({
    data: {
      service: "mini-crm-api",
      status: "ok",
    },
    success: true,
  });
});

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/clients", requireAuth, clientRoutes);
apiRoutes.use("/dashboard", requireAuth, dashboardRoutes);
apiRoutes.use("/pipeline", requireAuth, pipelineRoutes);
