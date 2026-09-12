const { getTerrain } = require("./terrainEngine");

const {
    calculateImpact
} = require("./impactEngine");

const {
    generateDecision
} = require("./decisionEngine");
function createSimulation(parameters) {
    const terrain = getTerrain();

    const {
        rainfall,
        drainageCapacity,
        initialWaterLevel,
        duration
    } = parameters;

    const rows = terrain.length;
    const cols = terrain[0].length;

    // Water depth grid
    let water = Array.from(
        { length: rows },
        () => Array(cols).fill(0)
    );

    // Initial water at the upper-left source
    water[0][0] = initialWaterLevel / 100;

    // Calculate flow direction
    const flowDirections = [];

    for (let r = 0; r < rows; r++) {
        flowDirections[r] = [];

        for (let c = 0; c < cols; c++) {

            let lowestElevation = terrain[r][c];
            let direction = "NONE";

            const neighbors = [
                [-1, 0, "N"],
                [1, 0, "S"],
                [0, -1, "W"],
                [0, 1, "E"],
                [-1, -1, "NW"],
                [-1, 1, "NE"],
                [1, -1, "SW"],
                [1, 1, "SE"]
            ];

            for (const [dr, dc, dir] of neighbors) {

                const nr = r + dr;
                const nc = c + dc;

                if (
                    nr >= 0 &&
                    nr < rows &&
                    nc >= 0 &&
                    nc < cols
                ) {
                    if (terrain[nr][nc] < lowestElevation) {
                        lowestElevation = terrain[nr][nc];
                        direction = dir;
                    }
                }
            }

            flowDirections[r][c] = direction;
        }
    }

    // Simulation settings
    const timeStep = 5;
    const steps = Math.ceil(duration / timeStep);

    const frames = [];

    // Track first arrival of water
    const arrivalTime = Array.from(
        { length: rows },
        () => Array(cols).fill(null)
    );

    // Simulation
    for (let step = 0; step <= steps; step++) {

        const currentTime = step * timeStep;

        // Add rainfall runoff to source
        const runoff = (rainfall / 100) * 0.08;

        water[0][0] += runoff;

        // Initial water copy
        const nextWater = water.map(row => [...row]);

        for (let r = 0; r < rows; r++) {

            for (let c = 0; c < cols; c++) {

                if (water[r][c] <= 0) {
                    continue;
                }

                const currentElevation = terrain[r][c];

                const neighbors = [
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1],
                    [-1, -1],
                    [-1, 1],
                    [1, -1],
                    [1, 1]
                ];

                const lowerNeighbors = [];

                for (const [dr, dc] of neighbors) {

                    const nr = r + dr;
                    const nc = c + dc;

                    if (
                        nr >= 0 &&
                        nr < rows &&
                        nc >= 0 &&
                        nc < cols &&
                        terrain[nr][nc] < currentElevation
                    ) {
                        lowerNeighbors.push([nr, nc]);
                    }
                }

                if (lowerNeighbors.length > 0) {

                    const flowAmount =
                        water[r][c] * 0.25;

                    const amountPerCell =
                        flowAmount / lowerNeighbors.length;

                    nextWater[r][c] -= flowAmount;

                    for (const [nr, nc] of lowerNeighbors) {
                        nextWater[nr][nc] += amountPerCell;
                    }
                }

                // Drainage
                const drainageRate =
                    drainageCapacity / 100 * 0.05;

                nextWater[r][c] *= (1 - drainageRate);

                // Record arrival time
                if (
                    nextWater[r][c] > 0.05 &&
                    arrivalTime[r][c] === null
                ) {
                    arrivalTime[r][c] = currentTime;
                }
            }
        }

        water = nextWater;

        // Calculate frame statistics
        let floodedCells = 0;
        let maxDepth = 0;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {

                if (water[r][c] > 0.05) {
                    floodedCells++;
                }

                maxDepth = Math.max(
                    maxDepth,
                    water[r][c]
                );
            }
        }

        frames.push({
            time: currentTime,
            water: water.map(row => [...row]),
            floodedCells,
            maxDepth: Number(maxDepth.toFixed(3))
        });
    }

    // Final statistics
    const finalFrame = frames[frames.length - 1];

    const floodedArea = finalFrame.floodedCells;

    let earliestArrival = null;

    for (const row of arrivalTime) {
        for (const value of row) {
            if (value !== null) {
                if (
                    earliestArrival === null ||
                    value < earliestArrival
                ) {
                    earliestArrival = value;
                }
            }
        }
    }

    const summary = {
    floodedArea,
    maxDepth: finalFrame.maxDepth,
    earliestArrival
};


const impact = calculateImpact(
    terrain,
    frames,
    arrivalTime
);


const decision = generateDecision({
    rainfall,
    drainageCapacity,
    maxDepth: finalFrame.maxDepth,
    floodedArea,
    impact
});


return {
    parameters,
    terrain,
    flowDirections,
    arrivalTime,
    frames,

    summary,

    impact,

    decision
};
}

module.exports = {
    createSimulation
};