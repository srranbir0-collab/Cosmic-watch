
// @ts-nocheck
import * as Prisma from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = Prisma as any;
const prisma = new PrismaClient();

const realAsteroids = [
  { id: "2099942", name: "99942 Apophis (2004 MN4)", hazardous: true, diamMin: 0.29, diamMax: 0.35, velocity: 110000, miss: 35000 },
  { id: "3542519", name: "(2010 PK9)", hazardous: true, diamMin: 0.116, diamMax: 0.260, velocity: 45000, miss: 7400000 },
  { id: "2465633", name: "465633 (2009 JR5)", hazardous: true, diamMin: 0.212, diamMax: 0.474, velocity: 65232, miss: 30000000 },
  { id: "54275604", name: "(2022 UD)", hazardous: false, diamMin: 0.009, diamMax: 0.021, velocity: 38000, miss: 1200000 },
  { id: "3729835", name: "(2015 RN35)", hazardous: false, diamMin: 0.05, diamMax: 0.12, velocity: 22000, miss: 680000 },
  { id: "3843516", name: "(2019 OK)", hazardous: true, diamMin: 0.057, diamMax: 0.13, velocity: 88000, miss: 72000 },
  { id: "2162173", name: "162173 Ryugu (1999 JU3)", hazardous: true, diamMin: 0.85, diamMax: 0.95, velocity: 28000, miss: 98000000 },
  { id: "2101955", name: "101955 Bennu (1999 RQ36)", hazardous: true, diamMin: 0.48, diamMax: 0.51, velocity: 101000, miss: 450000 },
  { id: "2410777", name: "410777 (2009 FD)", hazardous: false, diamMin: 0.13, diamMax: 0.29, velocity: 56000, miss: 15000000 },
  { id: "2029075", name: "29075 (1950 DA)", hazardous: true, diamMin: 1.1, diamMax: 1.3, velocity: 61000, miss: 12000000 },
  // ... adding more programmatically to reach 50
];

// Helper to generate random variations for demo purposes
function generateMoreAsteroids(count: number) {
  const baseIds = 6000000;
  const list = [];
  for (let i = 0; i < count; i++) {
    const isHazardous = Math.random() > 0.8;
    list.push({
      id: (baseIds + i).toString(),
      name: `(${2023 + i} NEO${i})`,
      hazardous: isHazardous,
      diamMin: parseFloat((Math.random() * 0.5).toFixed(3)),
      diamMax: parseFloat((Math.random() * 0.9).toFixed(3)),
      velocity: Math.floor(Math.random() * 80000) + 20000,
      miss: Math.floor(Math.random() * 10000000) + 300000
    });
  }
  return list;
}

const allDemoData = [...realAsteroids, ...generateMoreAsteroids(40)];

async function main() {
  console.log('Start seeding ...');

  // Create Test User with valid password hash
  // Password is: CosmicWatch1!
  const passwordHash = await bcrypt.hash('CosmicWatch1!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cosmicwatch.dev' },
    update: {
      passwordHash: passwordHash // Update hash if user exists
    },
    create: {
      email: 'admin@cosmicwatch.dev',
      username: 'StarCommand',
      passwordHash: passwordHash,
      role: 'ADMIN',
      alertSettings: {
        create: {
          thresholdType: 'HAZARDOUS_ONLY',
          thresholdValue: 1.0
        }
      }
    },
  });

  console.log(`Created/Updated user: ${admin.username} (Password: CosmicWatch1!)`);

  // Seed Asteroids
  for (const ast of allDemoData) {
    const asteroid = await prisma.asteroid.upsert({
      where: { id: ast.id },
      update: {},
      create: {
        id: ast.id,
        name: ast.name,
        nasaJplUrl: `http://ssd.jpl.nasa.gov/sbdb.cgi?sstr=${ast.id}`,
        absoluteMagnitudeH: 20.0 + Math.random() * 5,
        estimatedDiameterMin: ast.diamMin,
        estimatedDiameterMax: ast.diamMax,
        isPotentiallyHazardous: ast.hazardous,
        closeApproachDate: new Date(),
        relativeVelocityKph: ast.velocity,
        missDistanceKm: ast.miss,
        orbitingBody: 'Earth'
      }
    });
    console.log(`Seeded asteroid: ${asteroid.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
