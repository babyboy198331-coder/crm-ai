const express = require("express");
const prisma = require("../prismaClient");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/overview", async (req, res) => {
  const [totalCustomers, byStatus, totalFiles, totalMeetingSummaries, totalFollowUps, recentCustomers] =
    await Promise.all([
      prisma.customer.count(),
      prisma.customer.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.fileAttachment.count(),
      prisma.meetingSummary.count(),
      prisma.followUpEmail.count(),
      prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  res.json({
    totalCustomers,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
    totalFiles,
    totalMeetingSummaries,
    totalFollowUps,
    recentCustomers,
  });
});

module.exports = router;
