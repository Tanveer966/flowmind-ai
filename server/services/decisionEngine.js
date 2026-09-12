function generateDecision({
    rainfall,
    drainageCapacity,
    maxDepth,
    floodedArea,
    impact
}) {

    let riskScore = 0;

    // Rainfall contribution
    riskScore += Math.min(
        30,
        rainfall / 10
    );

    // Drainage contribution
    riskScore +=
        (100 - drainageCapacity) * 0.25;

    // Water depth contribution
    riskScore += Math.min(
        20,
        maxDepth * 20
    );

    // Flooded area contribution
    riskScore += Math.min(
        15,
        floodedArea * 1.5
    );

    // Critical infrastructure
    riskScore +=
        impact.criticalAssetCount * 8;

    riskScore = Math.min(
        100,
        Math.round(riskScore)
    );


    let riskLevel;

    if (riskScore >= 75) {
        riskLevel = "CRITICAL";
    } else if (riskScore >= 55) {
        riskLevel = "HIGH";
    } else if (riskScore >= 30) {
        riskLevel = "MODERATE";
    } else {
        riskLevel = "LOW";
    }


    const recommendations = [];


    if (riskScore >= 75) {

        recommendations.push(
            "Issue immediate flood warning for vulnerable zones"
        );

        recommendations.push(
            "Restrict access to roads within the predicted flow path"
        );

    } else if (riskScore >= 55) {

        recommendations.push(
            "Issue early warning for low-elevation residential areas"
        );

        recommendations.push(
            "Monitor major roads and drainage channels"
        );

    } else {

        recommendations.push(
            "Continue monitoring rainfall and water accumulation"
        );

        recommendations.push(
            "Maintain drainage systems at operational capacity"
        );
    }


    if (impact.criticalAssetCount > 0) {

        recommendations.push(
            "Prioritize monitoring of critical infrastructure"
        );

    }


    if (drainageCapacity < 30) {

        recommendations.push(
            "Increase drainage response in low-lying areas"
        );

    }


    return {
        riskScore,
        riskLevel,
        recommendations
    };
}


module.exports = {
    generateDecision
};