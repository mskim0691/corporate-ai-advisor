import prisma from './prisma';
import { getCurrentYearMonth } from './utils';

export interface PolicyCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  message?: string;
}

/**
 * Get billing period for a user based on their subscription
 * - Free/Admin: Calendar month (1st to last day of month)
 * - Pro/Expert: Subscription billing cycle (currentPeriodStart to currentPeriodEnd)
 */
async function getBillingPeriod(userId: string, groupName: string): Promise<{ start: Date; end: Date }> {
  // Free and Admin use calendar month
  if (groupName === 'free' || groupName === 'admin') {
    const yearMonth = getCurrentYearMonth();
    const startOfMonth = new Date(`${yearMonth}-01`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);
    return { start: startOfMonth, end: endOfMonth };
  }

  // Pro and Expert use subscription billing cycle
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { currentPeriodStart: true, currentPeriodEnd: true },
  });

  if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
    return {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    };
  }

  // Fallback to calendar month if no subscription period found
  const yearMonth = getCurrentYearMonth();
  const startOfMonth = new Date(`${yearMonth}-01`);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);
  return { start: startOfMonth, end: endOfMonth };
}

/**
 * Get yearMonth key for usage log based on billing period
 * For subscription-based billing, use the period start date as the key
 */
function getYearMonthKey(periodStart: Date, groupName: string): string {
  // For pro/expert, use the subscription period start date as key
  if (groupName === 'pro' || groupName === 'expert') {
    return `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}-${String(periodStart.getDate()).padStart(2, '0')}`;
  }
  // For free/admin, use calendar month
  return getCurrentYearMonth();
}

/**
 * Determine the group name based on user role and subscription plan
 */
function resolveGroupName(userRole: string, subscriptionPlan?: string): string {
  if (userRole === 'admin') return 'admin';
  if (subscriptionPlan === 'expert') return 'expert';
  if (subscriptionPlan === 'pro') return 'pro';
  return 'free';
}

/**
 * 분석솔루션 사용 가능 여부 체크
 * @param userId - The user ID
 * @param userRole - The user's role (admin/user)
 * @param subscriptionPlan - The user's subscription plan (free/pro/expert)
 * @returns PolicyCheckResult
 */
export async function checkAnalysisPolicy(
  userId: string,
  userRole: string,
  subscriptionPlan?: string
): Promise<PolicyCheckResult> {
  const groupName = resolveGroupName(userRole, subscriptionPlan);

  // Fetch the policy for this group
  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  // If no policy exists, use default limits
  const monthlyLimit = policy?.monthlyAnalysisLimit ?? (groupName === 'admin' ? 999999 : groupName === 'expert' ? 30 : groupName === 'pro' ? 10 : 3);

  // Get billing period based on subscription type
  const billingPeriod = await getBillingPeriod(userId, groupName);
  const yearMonthKey = getYearMonthKey(billingPeriod.start, groupName);

  // Get usage for the billing period
  const usageLog = await prisma.usageLog.findUnique({
    where: {
      userId_yearMonth: {
        userId,
        yearMonth: yearMonthKey,
      },
    },
  });

  const currentUsage = usageLog?.count ?? 0;

  // Check if user has exceeded their limit
  if (currentUsage >= monthlyLimit) {
    return {
      allowed: false,
      limit: monthlyLimit,
      current: currentUsage,
      message: `이번 결제 주기 분석솔루션 제한(${monthlyLimit}회)을 초과했습니다. 현재 ${currentUsage}회 사용됨.`,
    };
  }

  return {
    allowed: true,
    limit: monthlyLimit,
    current: currentUsage,
  };
}

/**
 * 비주얼리포트 사용 가능 여부 체크
 * @param userId - The user ID
 * @param userRole - The user's role (admin/user)
 * @param subscriptionPlan - The user's subscription plan (free/pro/expert)
 * @returns PolicyCheckResult
 */
export async function checkVisualReportPolicy(
  userId: string,
  userRole: string,
  subscriptionPlan?: string
): Promise<PolicyCheckResult> {
  const groupName = resolveGroupName(userRole, subscriptionPlan);

  // Fetch the policy for this group
  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  // If no policy exists, use default limits
  const monthlyLimit = policy?.monthlyVisualReportLimit ?? (groupName === 'admin' ? 999999 : groupName === 'expert' ? 10 : groupName === 'pro' ? 1 : 0);

  // Get billing period based on subscription type
  const billingPeriod = await getBillingPeriod(userId, groupName);

  const visualReportCount = await prisma.report.count({
    where: {
      reportType: 'presentation',
      project: {
        userId,
      },
      createdAt: {
        gte: billingPeriod.start,
        lte: billingPeriod.end,
      },
    },
  });

  // Check if user has exceeded their limit
  if (visualReportCount >= monthlyLimit) {
    return {
      allowed: false,
      limit: monthlyLimit,
      current: visualReportCount,
      message: `이번 결제 주기 비주얼리포트 제한(${monthlyLimit}회)을 초과했습니다. 현재 ${visualReportCount}회 사용됨.`,
    };
  }

  return {
    allowed: true,
    limit: monthlyLimit,
    current: visualReportCount,
  };
}

/**
 * 사용자의 정책 정보 조회 (대시보드 등에서 사용)
 * @param userId - The user ID
 * @returns Group name, limits, and current usage
 */
export async function getUserPolicyInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
    },
  });

  if (!user) {
    return null;
  }

  const groupName = resolveGroupName(user.role, user.subscription?.plan);

  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  const monthlyAnalysisLimit = policy?.monthlyAnalysisLimit ?? (groupName === 'admin' ? 999999 : groupName === 'expert' ? 30 : groupName === 'pro' ? 10 : 3);
  const monthlyVisualReportLimit = policy?.monthlyVisualReportLimit ?? (groupName === 'admin' ? 999999 : groupName === 'expert' ? 10 : groupName === 'pro' ? 1 : 0);

  // Get billing period based on subscription type
  const billingPeriod = await getBillingPeriod(userId, groupName);
  const yearMonthKey = getYearMonthKey(billingPeriod.start, groupName);

  const usageLog = await prisma.usageLog.findUnique({
    where: {
      userId_yearMonth: {
        userId,
        yearMonth: yearMonthKey,
      },
    },
  });

  // Count visual reports for the billing period
  const visualReportCount = await prisma.report.count({
    where: {
      reportType: 'presentation',
      project: {
        userId,
      },
      createdAt: {
        gte: billingPeriod.start,
        lte: billingPeriod.end,
      },
    },
  });

  return {
    groupName,
    monthlyAnalysisLimit,
    monthlyVisualReportLimit,
    currentAnalysisUsage: usageLog?.count ?? 0,
    currentVisualReportUsage: visualReportCount,
    remainingAnalysis: Math.max(0, monthlyAnalysisLimit - (usageLog?.count ?? 0)),
    remainingVisualReport: Math.max(0, monthlyVisualReportLimit - visualReportCount),
    billingPeriodStart: billingPeriod.start,
    billingPeriodEnd: billingPeriod.end,
  };
}

// Backward compatibility aliases (deprecated)
export const checkProjectCreationPolicy = checkAnalysisPolicy;
export const checkPresentationCreationPolicy = checkVisualReportPolicy;
