import express from "express";
import {
  addTrial,
  getTrialsPaginated,
  compareTrials,
  resetTrials,
  getCommandStats,
  getCommandDistribution,
  getTopFastestTrials,
} from "../controllers/trialController.js";

const router = express.Router();

// ➕ Add a new trial
router.post("/", addTrial);

// 📊 Compare trials (supports ?person=1&range=20)
router.get("/compare", compareTrials);

// 📄 Paginated trials (supports ?person=1&page=1&limit=20)
router.get("/", getTrialsPaginated);

// 📈 Command usage distribution
router.get("/command-stats", getCommandStats);

// 📊 Command distribution (aggregate)
router.get("/commands/distribution", getCommandDistribution);

// 🧠 Alias route for backward compatibility
router.get("/aggregate", getCommandDistribution);

// 🗑 Reset all trials
router.delete("/reset", resetTrials);

// 🏆 Top 3 fastest trials
router.get("/top-fastest", getTopFastestTrials);


export default router;
