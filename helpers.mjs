import { Buffer } from "buffer";
import fs from "fs";

const fileToBase64 = (path) => {
  const type = path.split(".").pop().toLowerCase();
  if (!["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(type)) {
    throw new Error("Unsupported file type");
  }
  const Data = fs.readFileSync(`${path}`);
  const samplePngBuffer = Buffer.from(Data);
  switch (type) {
    case "jpg":
    case "jpeg":
      return `data:image/jpeg;base64,${samplePngBuffer.toString("base64")}`;
    case "gif":
      return `data:image/gif;base64,${samplePngBuffer.toString("base64")}`;
    case "svg":
      return `data:image/svg+xml;base64,${samplePngBuffer.toString("base64")}`;
    case "webp":
      return `data:image/webp;base64,${samplePngBuffer.toString("base64")}`;
    case "png":
      return `data:image/png;base64,${samplePngBuffer.toString("base64")}`;
  }
};

const ensureDB = () => {
  if (!fs.existsSync("db.json")) {
    fs.writeFileSync("db.json", '{"assessments": []}');
  }
};

const createAssessment = (assessmentData) => {
  console.log("Creating assessment with data:", assessmentData);
  ensureDB();
  const data = fs.readFileSync("db.json", "utf8");
  const db = JSON.parse(data);
  db.assessments.push(assessmentData);
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
};

const updateAssessmentStatus = async (id, status) => {
  ensureDB();
  const data = fs.readFileSync("db.json", "utf8");
  const db = JSON.parse(data);
  const index = db.assessments.findIndex((a) => a.id === id);

  if (index === -1) {
    console.error(`Assessment with id ${id} not found`);
    return false;
  }

  db.assessments[index].status = status;
  db.assessments[index].score = Math.floor(Math.random() * 101); // Random score between 0-100
  db.assessments[index].updatedAt = new Date().toISOString();
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));

  try {
    await fetch(db.assessments[index].webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assessmentData: db.assessments[index] }),
    });
    return true;
  } catch (error) {
    console.error(`Failed to send webhook: ${error.message}`);
    return false;
  }
};

const getReportById = (id) => {
  if (!fs.existsSync("db.json")) {
    return null;
  }
  const data = fs.readFileSync("db.json", "utf8");
  const db = JSON.parse(data);
  const assessment = db.assessments.find((a) => a.id === id);
  return assessment || null;
};

export {
  fileToBase64,
  createAssessment,
  updateAssessmentStatus,
  getReportById,
};
