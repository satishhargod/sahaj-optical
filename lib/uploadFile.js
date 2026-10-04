import fs from "fs";
import path from "path";

export const uploadFile = async (file, folder = "common") => {
  if (!file || typeof file === "string") {
    console.log("❌ Invalid file:", file);
    return null;
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name?.split(".").pop() || "jpg";

  const fileName = `${Date.now()}-${Math.round(
    Math.random() * 1e9
  )}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public/uploads", folder);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, buffer);

  return `/uploads/${folder}/${fileName}`;
};
export const deleteFile = (filePath) => {
  const fullPath = path.join(process.cwd(), "public", filePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};