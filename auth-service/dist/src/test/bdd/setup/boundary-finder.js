"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoundaryFinder = void 0;
class BoundaryFinder {
    static async findMaxBoundaries(maxResponseTime, success_rate, requestsCount) {
        const boundaries = {
            maxUsers: 0,
            maxRequestsPerSecond: 0,
            maxResponseTime: maxResponseTime || 1000,
        };
        const requests = requestsCount || 1000;
        const success_req = success_rate;
        for (let users = 1000; users <= 50000; users += 1000) {
            const performance = await this.testLoad(users, requests, success_rate);
            if (performance.successRate >= success_req && performance.avgResponseTime <= maxResponseTime) {
                boundaries.maxUsers = users;
                boundaries.maxRequestsPerSecond = Math.floor(requests / (performance.avgResponseTime / 1000));
            }
            else {
                break;
            }
        }
        return boundaries;
    }
    static async testLoad(users, requests, success) {
        const successRatePercentage = success;
        const successRate = successRatePercentage / 100;
        const simulatedRequests = requests;
        const successCount = Math.floor(simulatedRequests * successRate);
        const failureCount = simulatedRequests - successCount;
        const baseTime = 100;
        const loadFactor = Math.log10(users + requests) * 0.8;
        const avgResponseTime = baseTime + (loadFactor * 250);
        return {
            successRate: (successCount / simulatedRequests) * 100,
            avgResponseTime: Math.min(avgResponseTime, 5000),
            totalRequests: simulatedRequests,
            successfulRequests: successCount,
            failedRequests: failureCount
        };
    }
}
exports.BoundaryFinder = BoundaryFinder;
//# sourceMappingURL=boundary-finder.js.map