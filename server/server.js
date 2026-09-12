const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const simulationRoutes = require("./routes/simulationRoutes");
const scenarioRoutes = require("./routes/scenarioRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "FlowMind AI API is running",
        status: "online"
    });
});

app.use("/api/simulations", simulationRoutes);

app.use("/api/scenarios", scenarioRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `FlowMind server running on http://localhost:${PORT}`
    );
});