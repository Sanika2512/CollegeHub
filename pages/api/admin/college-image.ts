import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import multer from "multer";
import path from "path";
import { authOptions } from "@/lib/auth";

export const config = {
  api: {
    bodyParser: false
  }
};

type UploadRequest = NextApiRequest & {
  file?: Express.Multer.File;
};

const uploadDir = path.join(process.cwd(), "public", "uploads", "colleges");

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const safeName = path
        .basename(file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
      callback(null, `${Date.now()}-${safeName || "college"}${ext}`);
    }
  }),
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

function runUpload(req: UploadRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    upload.single("imageFile")(
      req as unknown as Parameters<ReturnType<typeof upload.single>>[0],
      res as unknown as Parameters<ReturnType<typeof upload.single>>[1],
      (error) => {
      if (error) reject(error);
      else resolve();
      }
    );
  });
}

export default async function handler(req: UploadRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Authentication required" });
  if (session.user.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });

  try {
    await runUpload(req, res);
    if (!req.file) return res.status(422).json({ error: "Choose an image file" });
    return res.status(201).json({ image: `/uploads/colleges/${req.file.filename}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed";
    return res.status(400).json({ error: message });
  }
}
