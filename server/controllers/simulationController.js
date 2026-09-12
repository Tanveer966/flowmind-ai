const mongoose = require("mongoose");

const {
    createSimulation
} = require("../services/simulationEngine");

const Simulation = require("../models/Simulation");

// Temporary in-memory storage
// Used when MongoDB is not connected
const memorySimulations = [];


// =====================================================
// RUN NEW SIMULATION
// POST /api/simulations
// =====================================================

const runSimulation = async (req, res) => {
    try {

        const {
            name,
            rainfall = 180,
            drainageCapacity = 45,
            initialWaterLevel = 20,
            duration = 60
        } = req.body;


        // Run the actual flood simulation
        const result = createSimulation({
            rainfall,
            drainageCapacity,
            initialWaterLevel,
            duration
        });


        // Generate a name if user didn't provide one
        const simulationName =
            name ||
            `Scenario ${rainfall}mm / ${drainageCapacity}%`;


        const simulationData = {
            name: simulationName,
            ...result
        };


        // ---------------------------------------------
        // SAVE TO MONGODB
        // ---------------------------------------------

        if (mongoose.connection.readyState === 1) {

            const savedSimulation =
                await Simulation.create(simulationData);

            return res.json({
                success: true,
                storage: "mongodb",
                data: savedSimulation
            });
        }


        // ---------------------------------------------
        // FALLBACK: MEMORY STORAGE
        // ---------------------------------------------

        const memorySimulation = {
            _id: Date.now().toString(),

            ...simulationData,

            createdAt: new Date()
        };


        memorySimulations.unshift(
            memorySimulation
        );


        res.json({
            success: true,
            storage: "memory",
            data: memorySimulation
        });


    } catch (error) {

        console.error(
            "Simulation error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// =====================================================
// GET ALL SIMULATIONS
// GET /api/simulations
// =====================================================

const getSimulations = async (req, res) => {

    try {

        // MongoDB connected
        if (mongoose.connection.readyState === 1) {

            const simulations =
                await Simulation.find()
                    .select(
                        "name parameters summary impact decision createdAt"
                    )
                    .sort({
                        createdAt: -1
                    });


            return res.json({
                success: true,
                storage: "mongodb",
                data: simulations
            });
        }


        // Memory fallback
        res.json({
            success: true,
            storage: "memory",
            data: memorySimulations
        });


    } catch (error) {

        console.error(
            "Get simulations error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// =====================================================
// GET ONE SIMULATION
// GET /api/simulations/:id
// =====================================================

const getSimulation = async (req, res) => {

    try {

        // MongoDB connected
        if (mongoose.connection.readyState === 1) {

            const simulation =
                await Simulation.findById(
                    req.params.id
                );


            if (!simulation) {

                return res.status(404).json({
                    success: false,
                    message: "Simulation not found"
                });
            }


            return res.json({
                success: true,
                storage: "mongodb",
                data: simulation
            });
        }


        // Memory fallback
        const simulation =
            memorySimulations.find(
                item =>
                    item._id === req.params.id
            );


        if (!simulation) {

            return res.status(404).json({
                success: false,
                message: "Simulation not found"
            });
        }


        res.json({
            success: true,
            storage: "memory",
            data: simulation
        });


    } catch (error) {

        console.error(
            "Get simulation error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// =====================================================
// DELETE SIMULATION
// DELETE /api/simulations/:id
// =====================================================

const deleteSimulation = async (req, res) => {

    try {

        // MongoDB connected
        if (mongoose.connection.readyState === 1) {

            const deletedSimulation =
                await Simulation.findByIdAndDelete(
                    req.params.id
                );


            if (!deletedSimulation) {

                return res.status(404).json({
                    success: false,
                    message: "Simulation not found"
                });
            }


            return res.json({
                success: true,
                message: "Simulation deleted successfully"
            });
        }


        // Memory fallback
        const index =
            memorySimulations.findIndex(
                item =>
                    item._id === req.params.id
            );


        if (index === -1) {

            return res.status(404).json({
                success: false,
                message: "Simulation not found"
            });
        }


        memorySimulations.splice(
            index,
            1
        );


        res.json({
            success: true,
            message: "Simulation deleted successfully"
        });


    } catch (error) {

        console.error(
            "Delete simulation error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// =====================================================
// COMPARE SCENARIOS
// GET /api/scenarios/compare
// =====================================================

const compareScenarios = async (req, res) => {

    try {

        let simulations;


        // ---------------------------------------------
        // GET FROM MONGODB
        // ---------------------------------------------

        if (mongoose.connection.readyState === 1) {

            simulations =
                await Simulation.find()
                    .select(
                        "name parameters summary impact decision createdAt"
                    )
                    .sort({
                        createdAt: -1
                    });

        }

        // ---------------------------------------------
        // MEMORY FALLBACK
        // ---------------------------------------------

        else {

            simulations =
                memorySimulations;
        }


        // ---------------------------------------------
        // CREATE COMPARISON DATA
        // ---------------------------------------------

        const comparison =
            simulations.map(
                (simulation) => {

                    return {

                        name:
                            simulation.name,

                        rainfall:
                            simulation.parameters?.rainfall || 0,

                        drainageCapacity:
                            simulation.parameters
                                ?.drainageCapacity || 0,

                        floodedArea:
                            simulation.summary
                                ?.floodedArea || 0,

                        maxDepth:
                            simulation.summary
                                ?.maxDepth || 0,

                        earliestArrival:
                            simulation.summary
                                ?.earliestArrival ?? null,

                        riskScore:
                            simulation.decision
                                ?.riskScore || 0,

                        riskLevel:
                            simulation.decision
                                ?.riskLevel || "LOW",

                        affectedZones:
                            simulation.impact
                                ?.totalAffectedZones || 0,

                        criticalAssets:
                            simulation.impact
                                ?.criticalAssetCount || 0,

                        createdAt:
                            simulation.createdAt
                    };
                }
            );


        res.json({
            success: true,
            data: comparison
        });


    } catch (error) {

        console.error(
            "Scenario comparison error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// =====================================================
// EXPORT FUNCTIONS
// =====================================================

module.exports = {

    runSimulation,

    getSimulations,

    getSimulation,

    deleteSimulation,

    compareScenarios

};