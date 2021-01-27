import express from "express";
const app = express();

import * as users from "./routes/users";

app.get("/u/:userId", users.getById);

app.listen(7527);
