const mongoose = require("mongoose");

const simulationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        parameters: {
            rainfall: Number,
            drainageCapacity: Number,
            initialWaterLevel: Number,
            duration: Number
        },

        terrain: Array,

        flowDirections: Array,

        arrivalTime: Array,

        frames: Array,

        summary: {
            floodedArea: Number,
            maxDepth: Number,
            earliestArrival: Number
        },

        impact: {
            affectedZones: Array,
            criticalAssets: Array,
            totalAffectedZones: Number,
            criticalAssetCount: Number
        },

        decision: {
            riskScore: Number,
            riskLevel: String,
            recommendations: Array
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Simulation",
    simulationSchema
);