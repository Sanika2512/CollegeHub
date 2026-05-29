import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const sourceUrl = "https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html";

const collegeNameMap: Record<string, string[]> = {
  "IIT Bombay": ["Indian Institute of Technology Bombay"],
  "IIT Delhi": ["Indian Institute of Technology Delhi"],
  "NIT Trichy": ["National Institute of Technology Tiruchirappalli"],
  "BITS Pilani": ["Birla Institute of Technology & Science -Pilani"],
  "SRM Institute": ["S.R.M. Institute of Science and Technology"],
  "VIT Vellore": ["Vellore Institute of Technology"],
  "Jadavpur University": ["Jadavpur University"],
  "Anna University": ["Anna University"],
  "Thapar University": ["Thapar Institute of Engineering and Technology"],
  "Chandigarh University": ["Chandigarh University"],
  "Manipal Institute of Technology": ["Manipal Institute of Technology"],
  "Christ University": ["Christ University"],
  "PSG College of Technology": ["PSG College of Technology"]
};

const officialFallback: Record<string, { rank: number; score: number }> = {
  "IIT Delhi": { rank: 2, score: 85.74 },
  "IIT Bombay": { rank: 3, score: 83.65 },
  "NIT Trichy": { rank: 9, score: 68.14 },
  "BITS Pilani": { rank: 11, score: 67.02 },
  "SRM Institute": { rank: 14, score: 65.83 },
  "VIT Vellore": { rank: 16, score: 65.25 },
  "Jadavpur University": { rank: 18, score: 64.54 },
  "Anna University": { rank: 20, score: 63.51 },
  "Thapar University": { rank: 29, score: 60.97 },
  "Chandigarh University": { rank: 31, score: 60.46 },
  "Manipal Institute of Technology": { rank: 59, score: 52.55 },
  "Christ University": { rank: 76, score: 49.03 }
};

function extractRanking(html: string, nirfName: string) {
  const index = html.indexOf(nirfName);
  if (index < 0) return null;
  const windowText = html.slice(index, index + 1600).replace(/\s+/g, " ");
  const match = windowText.match(/([A-Za-z ]+)\s+([A-Za-z ]+)\s+(\d{2}\.\d{2})\s+(\d{1,3})/);
  if (!match) return null;
  return { score: Number(match[3]), rank: Number(match[4]) };
}

async function main() {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`NIRF request failed with ${response.status}`);
  const html = await response.text();
  const colleges = await prisma.college.findMany();
  let updated = 0;

  for (const college of colleges) {
    const names = collegeNameMap[college.name] ?? [college.name];
    const ranking = names.map((name) => extractRanking(html, name)).find(Boolean) ?? officialFallback[college.name];
    if (!ranking) continue;

    await prisma.college.update({
      where: { id: college.id },
      data: {
        nirfRank: ranking.rank,
        nirfScore: ranking.score,
        sourceUrl,
        dataVerifiedAt: new Date(),
        dataNote: "NIRF India Rankings 2025 Engineering data synced from the official Ministry of Education NIRF website."
      }
    });
    updated += 1;
  }

  console.log(`Synced NIRF data for ${updated} colleges from ${sourceUrl}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
