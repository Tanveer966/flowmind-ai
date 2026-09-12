const express = require("express");

const {
    runSimulation,
    getSimulations,
    getSimulation,
    deleteSimulation
} = require("../controllers/simulationController");

const router = express.Router();


// Run a new simulation
router.post("/", runSimulation);


// Get simulation history
router.get("/", getSimulations);


// Get one simulation
router.get("/:id", getSimulation);


// Delete a simulation
router.delete("/:id", deleteSimulation);


module.exports = router;