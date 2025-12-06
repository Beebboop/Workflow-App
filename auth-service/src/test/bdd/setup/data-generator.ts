/* eslint-disable prettier/prettier */
export class DataGenerator {
    static generateUsers(count: number): Array<{
        email: string;
        name: string;
        password: string;
    }> {
        return Array.from({ length: count }, (_, i) => ({
            email: `user${i}@test.com`,
            name: `User ${i}`,
            password: this.generatePassword(12),
        }));
    }

    static generatePassword(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        return Array.from({ length }, () => 
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
    }

    static generateLoadTestScenarios(): Array<{
        users: number;
        requests: number;
        label: string;
    }> {
        return [
            { users: 1000, requests: 1000, label: 'SMALL' },
            { users: 5000, requests: 5000, label: 'MEDIUM' },
            { users: 10000, requests: 10000, label: 'LARGE' },
            { users: 50000, requests: 50000, label: 'XLARGE' },
        ];
    }
}