import "dotenv/config";
import express from "express";
import cors from "cors";
import { PORT, CORS_ORIGINS } from "./config/constants.js";

// Routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import chatRoutes from "./routes/chat.js";
import onboardingRoutes from "./routes/onboarding.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      return CORS_ORIGINS.includes(origin)
        ? cb(null, true)
        : cb(new Error("CORS bloqueado"));
    },
  })
);
app.use(express.json({ limit: "25mb" }));

// Base Routes
app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "backend",
    message: "API activa. Usa GET /health o POST /chat",
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// Feature Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/chat", chatRoutes);
app.use("/api/configurar-onboarding", onboardingRoutes);

// Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listo en http://0.0.0.0:${PORT}`);
});