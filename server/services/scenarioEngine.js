const { createSimulation } = require("./simulationEngine");

function compareScenarios() {
    const scenarios = [
        {
            id: "normal",
            name: "Normal",
            rainfall: 120,
            drainageCapacity: 80,
            initialWaterLevel: 10,
            duration: 60
        },
        {
            id: "severe",
            name: "Severe",
            rainfall: 180,
            drainageCapacity: 45,
            initialWaterLevel: 20,
            duration: 60
        },
        {
            id: "extreme",
            name: "Extreme",
            rainfall: 240,
            drainageCapacity: 25,
            initialWaterLevel: 35,
            duration: 60
        }
    ];

    return scenarios.map((scenario) => {

        const simulation = createSimulation({
            rainfall: scenario.rainfall,
            drainageCapacity: scenario.drainageCapacity,
            initialWaterLevel: scenario.initialWaterLevel,
            duration: scenario.duration
        });

        return {
            id: scenario.id,
            name: scenario.name,

            parameters: {
                rainfall: scenario.rainfall,
                drainageCapacity: scenario.drainageCapacity,
                initialWaterLevel: scenario.initialWaterLevel,
                duration: scenario.duration
            },

            riskScore: simulation.decision.riskScore,
            riskLevel: simulation.decision.riskLevel,

            maxDepth: simulation.summary.maxDepth,

            floodedArea: simulation.summary.floodedArea,

            earliestArrival:
                simulation.summary.earliestArrival,

            affectedZones:
                simulation.impact.totalAffectedZones,

            criticalAssets:
                simulation.impact.criticalAssetCount
        };
    });
}

module.exports = {
    compareScenarios
};