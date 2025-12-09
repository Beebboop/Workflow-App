export declare class BoundaryFinder {
    static findMaxBoundaries(maxResponseTime: number, success_rate: number, requestsCount?: number): Promise<{
        maxUsers: number;
        maxRequestsPerSecond: number;
        maxResponseTime: number;
    }>;
    private static testLoad;
}
