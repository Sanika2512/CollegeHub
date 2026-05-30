import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "6mb"
    }
  }
};

type UploadRequest = NextApiRequest & {
  body: {
    data?: string;       // base64 image data
    filename?: string;
  };
};

// Upload to Cloudinary using unsigned upload preset OR signed with API key
async function uploadToCloudinary(base64Data: string, filename: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME env variable not set");

  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

  // Use unsigned preset if available, else signed
  if (uploadPreset) {
    // Unsigned upload (simpler - just needs upload preset)
    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64}`);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "collegehub");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? "Cloudinary upload failed");
    return result.secure_url as string;
  }

  if (apiKey && apiSecret) {
    // Signed upload
    const timestamp = Math.round(Date.now() / 1000);
    const str = `folder=collegehub&timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64}`);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", "collegehub");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message ?? "Cloudinary upload failed");
    return result.secure_url as string;
  }

  throw new Error("Set CLOUDINARY_UPLOAD_PRESET (unsigned) or CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET in environment variables");
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
    const { data, filename = "college.jpg" } = req.body;
    if (!data) return res.status(422).json({ error: "No image data provided" });

    const imageUrl = await uploadToCloudinary(data, filename);
    return res.status(201).json({ image: imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed";
    return res.status(400).json({ error: message });
  }
}
