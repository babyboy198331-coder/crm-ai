const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const prisma = require("../prismaClient");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString("hex");
    cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".txt"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

// Upload a file attached to a customer
router.post("/:customerId", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const customer = await prisma.customer.findUnique({ where: { id: req.params.customerId } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const attachment = await prisma.fileAttachment.create({
    data: {
      customerId: customer.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    },
  });
  res.status(201).json(attachment);
});

// List files for a customer
router.get("/:customerId", async (req, res) => {
  const files = await prisma.fileAttachment.findMany({
    where: { customerId: req.params.customerId },
    orderBy: { createdAt: "desc" },
  });
  res.json(files);
});

// Download a file by attachment id
router.get("/download/:id", async (req, res) => {
  const attachment = await prisma.fileAttachment.findUnique({ where: { id: req.params.id } });
  if (!attachment) return res.status(404).json({ error: "File not found" });
  res.download(attachment.path, attachment.originalName);
});

module.exports = router;
