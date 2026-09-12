function calculateImpact(terrain, frames, arrivalTime) {
    const finalFrame = frames[frames.length - 1];

    const water = finalFrame.water;

    const zones = [
        {
            name: "Residential Zone A",
            row: 1,
            col: 1,
            priority: 3
        },
        {
            name: "Main Road",
            row: 2,
            col: 2,
            priority: 4
        },
        {
            name: "School",
            row: 3,
            col: 2,
            priority: 5
        },
        {
            name: "Hospital",
            row: 3,
            col: 3,
            priority: 5
        },
        {
            name: "Industrial Area",
            row: 4,
            col: 3,
            priority: 3
        }
    ];

    const affectedZones = [];

    for (const zone of zones) {
        const depth = water[zone.row][zone.col];

        if (depth > 0.05) {
            affectedZones.push({
                name: zone.name,
                depth: Number(depth.toFixed(3)),
                arrivalTime: arrivalTime[zone.row][zone.col],
                priority: zone.priority
            });
        }
    }

    let criticalAssets = affectedZones.filter(
        (zone) => zone.priority >= 5
    );

    return {
        affectedZones,
        criticalAssets,
        totalAffectedZones: affectedZones.length,
        criticalAssetCount: criticalAssets.length
    };
}

module.exports = {
    calculateImpact
};