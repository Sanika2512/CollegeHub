import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/utils";

const prisma = new PrismaClient();

async function main() {
  const colleges = await prisma.college.findMany({ orderBy: { rating: "desc" } });
  if (!colleges.length) return;

  const existingCutoffs = await prisma.cutoff.count();
  if (existingCutoffs === 0) {
    for (let index = 0; index < colleges.length; index += 1) {
      const college = colleges[index];
      await prisma.cutoff.createMany({
        data: [
          { collegeId: college.id, exam: "JEE Main", rank: 900 + index * 2400, category: "General", state: college.state, branch: "Computer Science" },
          { collegeId: college.id, exam: "JEE Main", rank: 1800 + index * 2900, category: "OBC", state: college.state, branch: "Electronics" },
          { collegeId: college.id, exam: "JEE Advanced", rank: 220 + index * 650, category: "General", state: college.state, branch: "Computer Science" },
          { collegeId: college.id, exam: "CUET", rank: 1200 + index * 1800, category: "General", state: college.state, branch: college.stream.includes("commerce") ? "Commerce" : "Science" },
          { collegeId: college.id, exam: "CAT", rank: 70 + index * 120, category: "General", state: college.state, branch: "Management" }
        ]
      });
    }
  }

  const demo = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!demo) return;

  const existingQuestions = await prisma.question.count();
  if (existingQuestions > 0) return;

  const tags = await Promise.all(
    ["admissions", "placements", "cutoffs", "hostel", "scholarships", "branches"].map((name) =>
      prisma.tag.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } })
    )
  );

  const questions = [
    {
      title: "Which colleges are realistic for a 12,000 JEE Main rank?",
      body: "I am looking for computer science or electronics with a preference for Maharashtra and Karnataka. Which options should I keep as safe and moderate?",
      category: "Admissions",
      tagIndexes: [0, 2, 5],
      answers: [
        "Keep COEP, RVCE, and PSG on your list for a balanced mix. Treat top IITs and NIT Trichy computer science as dream options.",
        "Use state quota carefully. If your home state matches the institute, a moderate option can become much more realistic."
      ]
    },
    {
      title: "How should I compare private engineering colleges beyond fees?",
      body: "Fees are high in many private colleges. What else should I compare before shortlisting?",
      category: "College Comparison",
      tagIndexes: [1, 3, 4],
      answers: [
        "Look at branch-level placements, internship access, faculty stability, alumni outcomes, and transparent placement reports.",
        "Campus location matters too. A slightly higher fee can be worth it when industry access and peer quality are stronger."
      ]
    }
  ];

  for (const item of questions) {
    const question = await prisma.question.create({
      data: {
        title: item.title,
        body: item.body,
        slug: `${slugify(item.title)}-${Date.now().toString(36)}`,
        category: item.category,
        authorId: demo.id,
        questionTags: { create: item.tagIndexes.map((tagIndex) => ({ tagId: tags[tagIndex].id })) }
      }
    });

    for (const body of item.answers) {
      await prisma.answer.create({ data: { body, questionId: question.id, authorId: demo.id } });
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
