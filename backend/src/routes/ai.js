const express = require("express");
const { z } = require("zod");
const prisma = require("../prismaClient");
const { requireAuth } = require("../middleware/auth");
const { getOpenAIClient } = require("../services/openaiClient");

const router = express.Router();
router.use(requireAuth);

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// --- Meeting summary ---
const summarySchema = z.object({
  customerId: z.string().min(1),
  rawNotes: z.string().min(1),
});

router.post("/meeting-summary", async (req, res) => {
  const parsed = summarySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { customerId, rawNotes } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You summarize sales/customer meeting notes. Return a concise summary paragraph, then a bullet list of clear action items.",
        },
        {
          role: "user",
          content: `Customer: ${customer.name} (${customer.company || "no company"})\n\nRaw notes:\n${rawNotes}`,
        },
      ],
    });

    const text = completion.choices[0].message.content || "";
    const [summaryPart, ...rest] = text.split(/Action Items:?/i);
    const summary = summaryPart.trim();
    const actionItems = rest.join("Action Items:").trim() || null;

    const record = await prisma.meetingSummary.create({
      data: {
        customerId,
        authorId: req.user.id,
        rawNotes,
        summary,
        actionItems,
      },
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Follow-up email draft ---
const followUpSchema = z.object({
  customerId: z.string().min(1),
  context: z.string().min(1), // what happened / what to follow up on
  tone: z.string().optional(),
});

router.post("/follow-up-email", async (req, res) => {
  const parsed = followUpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { customerId, context, tone } = parsed.data;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You write professional follow-up emails for a sales rep. Tone: ${tone || "friendly and professional"}. Respond ONLY in this exact format:\nSubject: <subject line>\n\n<email body>`,
        },
        {
          role: "user",
          content: `Customer: ${customer.name} (${customer.company || "no company"})\n\nContext for follow-up:\n${context}`,
        },
      ],
    });

    const text = completion.choices[0].message.content || "";
    const subjectMatch = text.match(/^Subject:\s*(.+)$/im);
    const subject = subjectMatch ? subjectMatch[1].trim() : "Follow up";
    const body = text.replace(/^Subject:\s*.+$/im, "").trim();

    const record = await prisma.followUpEmail.create({
      data: { customerId, authorId: req.user.id, subject, body },
    });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Chatbot: ask questions about a customer (or general) ---
const chatSchema = z.object({
  customerId: z.string().optional(),
  message: z.string().min(1),
});

router.post("/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { customerId, message } = parsed.data;

  let contextBlock = "No specific customer selected.";
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        meetingNotes: { orderBy: { createdAt: "desc" }, take: 5 },
        followUps: { orderBy: { createdAt: "desc" }, take: 5 },
        files: true,
      },
    });
    if (customer) {
      contextBlock = `Customer: ${customer.name} | Company: ${customer.company || "-"} | Status: ${customer.status}\nNotes: ${customer.notes || "-"}\n\nRecent meeting summaries:\n${customer.meetingNotes.map((m) => `- ${m.summary}`).join("\n") || "none"}\n\nRecent follow-up emails:\n${customer.followUps.map((f) => `- ${f.subject}`).join("\n") || "none"}\n\nFiles: ${customer.files.map((f) => f.originalName).join(", ") || "none"}`;
    }
  }

  await prisma.chatMessage.create({
    data: { customerId: customerId || null, userId: req.user.id, role: "user", content: message },
  });

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful CRM assistant. Answer questions about the customer using the provided context. If the context doesn't contain the answer, say so honestly rather than guessing.",
        },
        { role: "user", content: `Context:\n${contextBlock}\n\nQuestion: ${message}` },
      ],
    });

    const reply = completion.choices[0].message.content || "";
    const saved = await prisma.chatMessage.create({
      data: { customerId: customerId || null, userId: req.user.id, role: "assistant", content: reply },
    });
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat history for a customer
router.get("/chat/:customerId", async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { customerId: req.params.customerId },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages);
});

module.exports = router;
