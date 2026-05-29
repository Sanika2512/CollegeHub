import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { slugify } from "../lib/utils";

const prisma = new PrismaClient();

const images = [
  "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop",
  "/college-placeholder.svg",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=1200&auto=format&fit=crop"
];

const data = [
  ["IIT Bombay", "Mumbai, Maharashtra", "Maharashtra", "Mumbai", "government", ["engineering", "science", "management"], "A++", 1958, 230000, 4.8, 21, 367, ["Google", "Microsoft", "Tata Steel", "Goldman Sachs"]],
  ["IIT Delhi", "New Delhi, Delhi", "Delhi", "New Delhi", "government", ["engineering", "science", "management"], "A++", 1961, 235000, 4.8, 20, 410, ["Amazon", "Microsoft", "Samsung", "Bain"]],
  ["BITS Pilani", "Pilani, Rajasthan", "Rajasthan", "Pilani", "private", ["engineering", "science", "pharmacy"], "A", 1964, 541000, 4.6, 18, 607, ["Adobe", "Oracle", "Flipkart", "Visa"]],
  ["NIT Trichy", "Tiruchirappalli, Tamil Nadu", "Tamil Nadu", "Tiruchirappalli", "government", ["engineering", "architecture", "management"], "A++", 1964, 175000, 4.7, 14, 52, ["Texas Instruments", "Larsen & Toubro", "Cisco", "Deloitte"]],
  ["VIT Vellore", "Vellore, Tamil Nadu", "Tamil Nadu", "Vellore", "private", ["engineering", "science", "management"], "A++", 1984, 198000, 4.3, 9, 88, ["TCS", "Infosys", "Microsoft", "Cognizant"]],
  ["Manipal Institute of Technology", "Manipal, Karnataka", "Karnataka", "Manipal", "private", ["engineering"], "A+", 1957, 335000, 4.4, 10, 54, ["Dell", "Philips", "Mercedes-Benz", "IBM"]],
  ["SRM Institute", "Chennai, Tamil Nadu", "Tamil Nadu", "Chennai", "deemed", ["engineering", "medical", "management"], "A++", 1985, 260000, 4.1, 8, 57, ["Wipro", "Amazon", "Hyundai", "Capgemini"]],
  ["Christ University", "Bengaluru, Karnataka", "Karnataka", "Bengaluru", "deemed", ["arts", "commerce", "management", "science"], "A+", 1969, 190000, 4.2, 7, 21, ["KPMG", "Deloitte", "EY", "Goldman Sachs"]],
  ["Amity University", "Noida, Uttar Pradesh", "Uttar Pradesh", "Noida", "private", ["engineering", "law", "arts", "management"], "A+", 2005, 280000, 4.0, 6, 45, ["HCL", "Accenture", "Amazon", "Byju's"]],
  ["Delhi University", "New Delhi, Delhi", "Delhi", "New Delhi", "government", ["arts", "commerce", "science", "law"], "A+", 1922, 26000, 4.5, 5, 35, ["McKinsey", "Deloitte", "Teach For India", "KPMG"]],
  ["Mumbai University", "Mumbai, Maharashtra", "Maharashtra", "Mumbai", "government", ["arts", "commerce", "science", "law"], "A++", 1857, 35000, 4.2, 4, 18, ["TCS", "ICICI Bank", "HDFC Bank", "L&T"]],
  ["Jadavpur University", "Kolkata, West Bengal", "West Bengal", "Kolkata", "government", ["engineering", "arts", "science"], "A", 1955, 2400, 4.6, 11, 85, ["PwC", "Google", "CESC", "Schneider Electric"]],
  ["Anna University", "Chennai, Tamil Nadu", "Tamil Nadu", "Chennai", "government", ["engineering", "architecture", "science"], "A", 1978, 55000, 4.4, 8, 36, ["Zoho", "Ford", "TVS", "Infosys"]],
  ["COEP Pune", "Pune, Maharashtra", "Maharashtra", "Pune", "government", ["engineering"], "A+", 1854, 90000, 4.5, 11, 50, ["Bajaj Auto", "Deutsche Bank", "Siemens", "PhonePe"]],
  ["RVCE Bangalore", "Bengaluru, Karnataka", "Karnataka", "Bengaluru", "private", ["engineering"], "A+", 1963, 240000, 4.3, 10, 60, ["SAP", "Qualcomm", "Bosch", "Walmart"]],
  ["Thapar University", "Patiala, Punjab", "Punjab", "Patiala", "deemed", ["engineering", "science", "management"], "A+", 1956, 470000, 4.2, 11, 55, ["Maruti Suzuki", "JP Morgan", "ZS Associates", "Microsoft"]],
  ["PSG College of Technology", "Coimbatore, Tamil Nadu", "Tamil Nadu", "Coimbatore", "private", ["engineering", "management"], "A++", 1951, 87000, 4.4, 9, 44, ["Caterpillar", "Zoho", "Bosch", "TCS"]],
  ["Symbiosis Pune", "Pune, Maharashtra", "Maharashtra", "Pune", "deemed", ["management", "law", "arts", "commerce"], "A++", 1971, 420000, 4.3, 10, 35, ["Deloitte", "KPMG", "Hindustan Unilever", "Asian Paints"]],
  ["LPU", "Phagwara, Punjab", "Punjab", "Phagwara", "private", ["engineering", "medical", "arts", "management"], "A++", 2005, 160000, 4.0, 6, 64, ["Cognizant", "Capgemini", "Amazon", "Bosch"]],
  ["Chandigarh University", "Mohali, Punjab", "Punjab", "Mohali", "private", ["engineering", "management", "arts", "medical"], "A+", 2012, 170000, 4.1, 7, 54, ["IBM", "Microsoft", "Deloitte", "Wipro"]]
] as const;

function about(name: string, city: string) {
  return `${name} is a respected Indian institution in ${city} known for rigorous academics, active student communities, industry-linked projects, and strong placement outcomes across its flagship programs.`;
}

function courses(stream: readonly string[], fees: number) {
  const base = [
    { name: "B.Tech Computer Science", duration: "4 years", seats: 120, fees },
    { name: "B.Tech Electronics", duration: "4 years", seats: 90, fees: Math.round(fees * 0.92) },
    { name: "MBA", duration: "2 years", seats: 60, fees: Math.round(fees * 1.15) }
  ];
  if (stream.includes("medical")) base.push({ name: "MBBS", duration: "5.5 years", seats: 100, fees: Math.round(fees * 1.4) });
  if (stream.includes("arts")) base.push({ name: "BA Economics", duration: "3 years", seats: 80, fees: Math.round(fees * 0.45) });
  if (stream.includes("commerce")) base.push({ name: "B.Com Honours", duration: "3 years", seats: 100, fees: Math.round(fees * 0.4) });
  return base.slice(0, 4);
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.answerVote.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.questionTag.deleteMany();
  await prisma.question.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.review.deleteMany();
  await prisma.savedCollege.deleteMany();
  await prisma.savedComparison.deleteMany();
  await prisma.cutoff.deleteMany();
  await prisma.course.deleteMany();
  await prisma.college.deleteMany();
  await prisma.user.deleteMany();

  const password = await hash("password123", 12);
  const demo = await prisma.user.create({
    data: { name: "Demo Student", email: "demo@collegehub.test", password }
  });

  for (let index = 0; index < data.length; index += 1) {
    const [name, location, state, city, type, stream, naacGrade, established, fees, rating, avgPackage, highPackage, topRecruiters] = data[index];
    const college = await prisma.college.create({
      data: {
        name,
        slug: slugify(name),
        location,
        state,
        city,
        type,
        stream: [...stream],
        naacGrade,
        established,
        fees,
        rating,
        reviewCount: 2,
        avgPackage,
        highPackage,
        topRecruiters: [...topRecruiters],
        about: about(name, city),
        image: images[index % images.length],
        courses: { create: courses(stream, fees) },
        reviews: {
          create: [
            {
              rating: Math.min(5, Math.round(rating)),
              title: "Strong academics and peer group",
              body: "Faculty quality, campus culture, and project opportunities are the strongest parts of the experience.",
              helpful: 18 + index,
              userId: demo.id
            },
            {
              rating: Math.max(3, Math.round(rating - 0.4)),
              title: "Placements are well supported",
              body: "The placement cell is active and alumni support makes internships and interview preparation smoother.",
              helpful: 9 + index,
              userId: demo.id
            }
          ]
        }
      }
    });

    if (index < 4) {
      await prisma.savedCollege.create({ data: { userId: demo.id, collegeId: college.id } });
    }

    await prisma.cutoff.createMany({
      data: [
        { collegeId: college.id, exam: "JEE Main", rank: 900 + index * 2400, category: "General", state, branch: "Computer Science" },
        { collegeId: college.id, exam: "JEE Main", rank: 1800 + index * 2900, category: "OBC", state, branch: "Electronics" },
        { collegeId: college.id, exam: "JEE Advanced", rank: 220 + index * 650, category: "General", state, branch: "Computer Science" },
        { collegeId: college.id, exam: "CUET", rank: 1200 + index * 1800, category: "General", state, branch: (stream as readonly string[]).includes("commerce") ? "Commerce" : "Science" },
        { collegeId: college.id, exam: "CAT", rank: 70 + index * 120, category: "General", state, branch: "Management" }
      ]
    });
  }

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
        "Keep COEP, RVCE, and PSG on your list for a balanced mix. For top IITs and NIT Trichy, treat computer science as a dream option at that rank.",
        "Use state quota carefully. If your home state matches the institute, a moderate option can become much more realistic."
      ]
    },
    {
      title: "How should I compare private engineering colleges beyond fees?",
      body: "Fees are high in many private colleges. What else should I compare before shortlisting?",
      category: "College Comparison",
      tagIndexes: [1, 3, 4],
      answers: [
        "Look at branch-level placements, internship access, faculty stability, alumni outcomes, and how transparent the college is with placement reports.",
        "Campus location matters too. A slightly higher fee can be worth it if the institute has strong industry access and a better peer group."
      ]
    },
    {
      title: "Do hostel facilities affect first-year experience?",
      body: "I am moving away from home for college and want to know how important hostel quality is.",
      category: "Campus Life",
      tagIndexes: [3],
      answers: ["Hostel quality matters most in the first semester. Reliable food, study spaces, internet, and safety make the transition much smoother."]
    }
  ];

  for (const item of questions) {
    const question = await prisma.question.create({
      data: {
        title: item.title,
        body: item.body,
        slug: `${slugify(item.title)}-${Math.random().toString(36).slice(2, 7)}`,
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
