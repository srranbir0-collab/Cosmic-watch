import { PrismaClient } from '@prisma/client';

// Prisma automatically connects using DATABASE_URL env var
// The startup.sh script constructs this URL from Pterodactyl's variables
const prisma = new PrismaClient({
    log: ['error', 'warn'], // Minimal logging for production
});

export const initDB = async () => {
    try {
        await prisma.$connect();
        console.log("Database connection established via Prisma.");
    } catch (error) {
        console.error("Failed to connect to database:", error);
    }
};

export default prisma;