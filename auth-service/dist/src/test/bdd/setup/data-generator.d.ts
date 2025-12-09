export declare class DataGenerator {
    static generateUsers(count: number): Array<{
        email: string;
        name: string;
        password: string;
    }>;
    static generatePassword(length: number): string;
    static generateLoadTestScenarios(): Array<{
        users: number;
        requests: number;
        label: string;
    }>;
}
