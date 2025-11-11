import Trial from "../models/Trial.js";

/* ===============================================
   @desc   Save a trial result
   @route  POST /api/trials
================================================ */
export const addTrial = async (req, res) => {
  try {
    const { source, responseTime, accuracy, errorRate, command, person } = req.body;

    if (person === undefined || person === null) {
      return res.status(400).json({ success: false, message: "Person field is required." });
    }

    const trial = new Trial({
      source,
      responseTime,
      accuracy,
      errorRate,
      command,
      person,
    });

    await trial.save();
    res.status(201).json({ success: true, data: trial });
  } catch (err) {
    console.error("Error saving trial:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ===============================================
   @desc   Get paginated trials (by person or all)
   @route  GET /api/trials?person=1&page=1&limit=20
================================================ */
export const getTrials = async (req, res) => {
  try {
    const { source } = req.params;
    const { page = 1, limit = 20, person } = req.query;

    const query = { source };
    if (person) query.person = person;

    const total = await Trial.countDocuments(query);
    const trials = await Trial.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: trials,
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
export const getTrialsPaginated = async (req, res) => {
  try {
    const { person = "All", page = 1, limit = 20 } = req.query;

    const filter = person !== "All" ? { person: Number(person) } : {};
    const total = await Trial.countDocuments(filter);

    const trials = await Trial.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
      data: trials,
    });
  } catch (err) {
    console.error("Error fetching paginated trials:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ===============================================
   @desc   Compare trials (averages per source)
   @route  GET /api/trials/compare?person=1&range=20
================================================ */
export const compareTrials = async (req, res) => {
  try {
    let { range = 20, person = "all" } = req.query;
    const sources = ["webkit", "onnx"];
    const results = {};

    for (const source of sources) {
      const query = { source };

      // ✅ If person ≠ "all", filter by person
      if (person.toLowerCase() !== "all") {
        query.person = person;
      }

      // ✅ Fetch trials: limit only if range ≠ "all"
      let trialsQuery = Trial.find(query).sort({ timestamp: -1 });
      if (range !== "all") {
        const limitVal = parseInt(range, 10);
        if (!isNaN(limitVal)) {
          trialsQuery = trialsQuery.limit(limitVal);
        }
      }

      const trials = await trialsQuery;

      if (trials.length > 0) {
        const avgResponseTime =
          trials.reduce((sum, t) => sum + t.responseTime, 0) / trials.length;
        const avgAccuracy =
          trials.reduce((sum, t) => sum + t.accuracy, 0) / trials.length;
        const avgErrorRate =
          trials.reduce((sum, t) => sum + t.errorRate, 0) / trials.length;

        results[source] = {
          person: person.toLowerCase() === "all" ? "All Trials" : person,
          avgResponseTime,
          avgAccuracy,
          avgErrorRate,
          count: trials.length,
          trend: trials.map((t) => ({
            accuracy: t.accuracy,
            responseTime: t.responseTime,
            errorRate: t.errorRate,
            timestamp: t.timestamp,
          })),
        };
      } else {
        results[source] = {
          person,
          avgResponseTime: null,
          avgAccuracy: null,
          avgErrorRate: null,
          count: 0,
          trend: [],
        };
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error in compareTrials:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};


/* ===============================================
   @desc   Command stats (same as before)
   @route  GET /api/trials/command-stats?range=20
================================================ */
export const getCommandStats = async (req, res) => {
  try {
    const range = parseInt(req.query.range, 10) || 20;
    const trials = await Trial.find({}).sort({ timestamp: -1 }).limit(range);

    const commandCounts = {};
    trials.forEach((t) => {
      const cmd = t.command || "unknown";
      commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
    });

    res.json({ success: true, data: commandCounts });
  } catch (err) {
    console.error("Error fetching command stats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================================
   @desc   Reset all trials
   @route  DELETE /api/trials/reset
================================================ */
export const resetTrials = async (req, res) => {
  try {
    await Trial.deleteMany({});
    res.json({ success: true, message: "All trial data has been reset." });
  } catch (err) {
    console.error("Error resetting trials:", err);
    res.status(500).json({ success: false, message: "Failed to reset trials." });
  }
};

/* ===============================================
   @desc   Get distribution of commands (aggregate)
   @route  GET /api/trials/commands/distribution
================================================ */
export const getCommandDistribution = async (req, res) => {
  try {
    const distribution = await Trial.aggregate([
      { $group: { _id: "$command", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: distribution.map((item) => ({
        command: item._id || "Unknown",
        count: item.count,
      })),
    });
  } catch (err) {
    console.error("Error fetching command distribution:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/* ===============================================
   @desc   Get top 3 fastest trials for a person
   @route  GET /api/trials/top-fastest?person=Person%206&range=20
================================================ */
export const getTopFastestTrials = async (req, res) => {
  try {
    let { person = "all", range = 20 } = req.query;

    const query = {};
    if (person.toLowerCase() !== "all") {
      query.person = person;
    }

    // ✅ Fetch all trials for the selected person
    let trialsQuery = Trial.find(query).sort({ responseTime: 1 }); // sort fastest first

    // ✅ Limit to range if not "all"
    if (range !== "all") {
      const limitVal = parseInt(range, 10);
      if (!isNaN(limitVal)) {
        trialsQuery = trialsQuery.limit(limitVal);
      }
    }

    const trials = await trialsQuery;

    if (trials.length === 0) {
      return res.json({
        success: true,
        data: {
          person,
          top3: [],
          avgAccuracy: null,
          avgErrorRate: null,
        },
      });
    }

    // ✅ Compute averages
    const avgAccuracy =
      trials.reduce((sum, t) => sum + t.accuracy, 0) / trials.length;
    const avgErrorRate =
      trials.reduce((sum, t) => sum + t.errorRate, 0) / trials.length;

    // ✅ Get top 3 fastest response times
    const top3 = trials
      .sort((a, b) => a.responseTime - b.responseTime)
      .slice(0, 3)
      .map((t) => ({
        responseTime: t.responseTime,
        accuracy: t.accuracy,
        errorRate: t.errorRate,
        timestamp: t.timestamp,
        source: t.source,
        command: t.command,
      }));

    res.json({
      success: true,
      data: {
        person,
        top3,
        avgAccuracy,
        avgErrorRate,
      },
    });
  } catch (err) {
    console.error("Error in getTopFastestTrials:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
