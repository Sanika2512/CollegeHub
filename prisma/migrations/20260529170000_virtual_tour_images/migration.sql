-- Add virtual campus tour images linked to colleges.
CREATE TABLE "CollegeTourImage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "collegeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollegeTourImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CollegeTourImage_collegeId_idx" ON "CollegeTourImage"("collegeId");

ALTER TABLE "CollegeTourImage"
ADD CONSTRAINT "CollegeTourImage_collegeId_fkey"
FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
