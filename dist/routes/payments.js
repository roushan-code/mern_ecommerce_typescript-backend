import express from "express";
const app = express.Router();
app.post("/newUser", newUser);
export default app;
