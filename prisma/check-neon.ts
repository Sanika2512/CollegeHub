import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [colleges, cutoffs, questions, users, database] = await Promise.all([
    prisma.college.count(),
    prisma.cutoff.count(),
    prisma.question.count(),
    prisma.user.count(),
    prisma.$queryRawUnsafe<Array<{ db: string }>>("select current_database() as db")
  ]);

  console.log(JSON.stringify({ colleges, cutoffs, questions, users, database: database[0]?.db }, null, 2));
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
