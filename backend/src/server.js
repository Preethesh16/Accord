import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import negotiateRouter from "./routes/negotiate.js";
import verifyRouter from "./routes/verify.js";
import releaseRouter from "./routes/release.js";
import refundRouter from "./routes/refund.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Accord Backend API",
    status: "ok",
    endpoints: ["/health", "/api/negotiate", "/api/verify", "/api/release", "/api/refund"],
  });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/negotiate", negotiateRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/release", releaseRouter);
app.use("/api/refund", refundRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Accord backend running on port ${config.port}`);
});
