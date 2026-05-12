import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/index";
import { globalErrorHandler } from "./errors/globalErrorHandler";
import { AppError } from "./errors/AppError";
import { router } from "./routes/index";

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(cookieParser());

// stripe webhook needs raw body — must be before express.json()
app.use(
  "/api/v1/payment/stripe/webhook",
  express.raw({ type: "application/json" }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Marketify server is running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", router);

app.all("/{*splat}", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(globalErrorHandler);

export { app };
