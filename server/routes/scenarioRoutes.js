const express = require("express");

const {
    compareScenarios
} = require("../controllers/simulationController");

const router = express.Router();

router.get("/compare", compareScenarios);

module.exports = router;