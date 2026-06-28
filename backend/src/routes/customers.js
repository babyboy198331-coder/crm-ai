const express = require("express");
const { z } = require("zod");
const prisma = require("../prismaClient");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const customerSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

// List all customers (with owner)
router.get("/", async (req, res) => {
  const customers = await prisma.customer.findMany({
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json(customers);
});

// Get one customer with related data
router.get("/:id", async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      files: true,
      meetingNotes: { orderBy: { createdAt: "desc" } },
      followUps: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

// Create customer
router.post("/", async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const customer = await prisma.customer.create({
    data: { ...parsed.data, ownerId: req.user.id },
  });
  res.status(201).json(customer);
});

// Update customer
router.put("/:id", async (req, res) => {
  const parsed = customerSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(customer);
  } catch (err) {
    res.status(404).json({ error: "Customer not found" });
  }
});

// Delete customer (admin/manager only)
router.delete("/:id", requireRole("ADMIN", "MANAGER"), async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: "Customer not found" });
  }
});

module.exports = router;
