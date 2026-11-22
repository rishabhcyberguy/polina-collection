import express from "express";
import app from "./server/_core/app.js";

const vercelApp: ReturnType<typeof express> = app;
export default vercelApp;
