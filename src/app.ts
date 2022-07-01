import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

import * as users from "./routes/users.js";

app.get("/u/:userId", limiter, users.getById);

app.listen(7527, () => {
  console.log("Listening on port 7527");
});
