import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth";

export const config = {
  api: {
    bodyParser: false
  }
};

type UploadRequest = NextApiRequest & {
  file?: Express.Multer.File;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// IMPORTANT: memoryStorage, NOT diskStorage.
// Render's filesystem is ephemeral — anything written to disk at runtime
// disappears on the next restart/redeploy/sleep-wake cycle, which is why
// uploaded images were reverting to the placeholder. We keep the file in
// memory only long enough to forward it to Cloudinary, which persists it.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  },
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

function uploadBufferToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "collegehub/colleges" },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

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
    const imageUrl = await uploadBufferToCloudinary(req.file.buffer);
    return res.status(201).json({ image: imageUrl });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.includes("File too large")
          ? "Image is too large. Please use an image under 15MB."
          : error.message
        : "Image upload failed";
    return res.status(400).json({ error: message });
  }
}
