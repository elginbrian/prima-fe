import { DeadlineItem, DeadlineStatus } from "@/types";

export function getDeadlineTiming(
  deadline: Partial<DeadlineItem> & { targetDate?: string },
  warningDays: number = 3
) {
  if (!deadline?.targetDate) {
    return { daysRemaining: 0, status: (deadline?.status || "On Track") as DeadlineStatus };
  }

  const cleanTargetDate = String(deadline.targetDate).split("T")[0];
  const parts = cleanTargetDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return { daysRemaining: 0, status: (deadline.status || "On Track") as DeadlineStatus };
  }

  let targetMidnight = Date.UTC(parts[0], parts[1] - 1, parts[2]);

  if (deadline.accumulatedPausedDays) {
    targetMidnight += deadline.accumulatedPausedDays * 86400000;
  }

  let compareMidnight: number;
  if (deadline.pausedAt) {
    const pDate = new Date(deadline.pausedAt);
    compareMidnight = Date.UTC(pDate.getUTCFullYear(), pDate.getUTCMonth(), pDate.getUTCDate());
  } else {
    const now = new Date();
    compareMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const daysRemaining = Math.round((targetMidnight - compareMidnight) / 86400000);

  if (deadline.status === "Selesai") {
    return { daysRemaining, status: "Selesai" as const };
  }

  const status: Exclude<DeadlineStatus, "Selesai"> = daysRemaining < 0
    ? "Overdue"
    : daysRemaining <= warningDays
      ? "At Risk"
      : "On Track";

  return { daysRemaining, status };
}
