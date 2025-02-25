import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Database Connection', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should connect to the database and run a simple query', async () => {
    // Ejecuta una consulta simple
    const result = await prisma.$queryRaw`SELECT 1 as result`;

    // Asumimos que el resultado es un arreglo de objetos con la propiedad "result" de tipo number
    const typedResult = result as Array<{ result: number }>;

    expect(typedResult).toBeDefined();
    expect(typedResult[0]?.result).toBe(1);
  });
});
