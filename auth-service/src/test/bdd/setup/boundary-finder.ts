/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */

export class BoundaryFinder {
    static async findMaxBoundaries(maxResponseTime: number, success_rate: number, requestsCount?: number) {
        const boundaries = {
            maxUsers: 0,
            maxRequestsPerSecond: 0,
            maxResponseTime: maxResponseTime || 1000, // начальное значение
        };

        const requests = requestsCount || 1000;

        const success_req = success_rate;

        // Тестируем с увеличивающейся нагрузкой
        for (let users = 1000; users <= 50000; users += 1000) {
            const performance = await this.testLoad(users, requests, success_rate);
            
            if (performance.successRate >= success_req && performance.avgResponseTime <= maxResponseTime) {
                boundaries.maxUsers = users;
                boundaries.maxRequestsPerSecond = Math.floor(requests / (performance.avgResponseTime / 1000));
            } else {
                break;
            }
        }

        return boundaries;
    }

    private static async testLoad(users: number, requests: number, success: number) {

        const successRatePercentage = success;
        const successRate = successRatePercentage / 100;
        
        // Имитация обработки запросов на основе переданных параметров
        const simulatedRequests = requests;
        const successCount = Math.floor(simulatedRequests * successRate);
        const failureCount = simulatedRequests - successCount;
        
        // Время ответа зависит от нагрузки (users и requests)
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