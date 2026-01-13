/**
 * Express szerver:
 * - /api/* REST végpontok
 * - / (client) statikus frontend kiszolgálása a client/ mappából
 */
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { initDb } from "./db.js";
import { errorHandler } from "./middleware/error.js";

import { authRoutes } from "./routes/auth.js";
import { gamesRoutes } from "./routes/games.js";
import { gotyRoutes } from "./routes/goty.js";
import { messagesRoutes } from "./routes/messages.js";
import { weeklyTopicsRoutes } from "./routes/weeklyTopics.js";
import { newsRoutes } from "./routes/news.js";
import { supportRoutes } from "./routes/support.js";
import { donateRoutes } from "./routes/donate.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const db = await initDb();

// API routes
app.use("server/client/assets/js/auth.js", authRoutes(db));
app.use("server/client/assets/js/games.js", gamesRoutes());
app.use("server/client/assets/js/goty.js", gotyRoutes(db));
app.use("server/client/assets/js/messages.js", messagesRoutes(db));
app.use("server/client/assets/js/weekly-topics.js", weeklyTopicsRoutes(db));
app.use("server/client/assets/js/news.js", newsRoutes());
app.use("server/client/assets/js/support.js", supportRoutes(db));
app.use("server/client/assets/js/donate.js", donateRoutes(db));

// Client statikus
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, "../../client");
app.use("/", express.static(clientDir));

// Hibakezelő
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Cyber Game Hub running on http://localhost:${port}`));
