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
 * Check if user can create a new project based on their group policy
 * @param userId - The user ID
 * @param userRole - The user's role (admin/user)
 * @param subscriptionPlan - The user's subscription plan (free/pro)
 * @returns PolicyCheckResult
 */
export async function checkProjectCreationPolicy(
  userId: string,
  userRole: string,
  subscriptionPlan?: string
): Promise<PolicyCheckResult> {
  // Determine the group based on role and subscription
  let groupName = 'free'; // default
  if (userRole === 'admin') {
    groupName = 'admin';
  } else if (subscriptionPlan === 'expert') {
    groupName = 'expert';
  } else if (subscriptionPlan === 'pro') {
    groupName = 'pro';
  }

  // Fetch the policy for this group
  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  // If no policy exists, use default limits
  const monthlyLimit = policy?.monthlyProjectLimit ?? (groupName === 'admin' ? 999999 : groupName === 'expert' ? 30 : groupName === 'pro' ? 10 : 3);

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
      message: `이번 결제 주기 프로젝트 생성 제한(${monthlyLimit}개)을 초과했습니다. 현재 ${currentUsage}개 생성됨.`,
    };
  }

  return {
    allowed: true,
    limit: monthlyLimit,
    current: currentUsage,
  };
}

/**
 * Check if user can create a PT report based on their group policy
 * @param userId - The user ID
 * @param userRole - The user's role (admin/user)
 * @param subscriptionPlan - The user's subscription plan (free/pro)
 * @returns PolicyCheckResult
 */
export async function checkPresentationCreationPolicy(
  userId: string,
  userRole: string,
  subscriptionPlan?: string
): Promise<PolicyCheckResult> {
  // Determine the group based on role and subscription
  let groupName = 'free'; // default
  if (userRole === 'admin') {
    groupName = 'admin';
  } else if (subscriptionPlan === 'expert') {
    groupName = 'expert';
  } else if (subscriptionPlan === 'pro') {
    groupName = 'pro';
  }

  // Fetch the policy for this group
  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  // If no policy exists, use default limits
  const monthlyLimit = policy?.monthlyPresentationLimit ?? (groupName === 'admin' ? 999999 : groupName === 'expert' ? 10 : groupName === 'pro' ? 1 : 0);

  // Get billing period based on subscription type
  const billingPeriod = await getBillingPeriod(userId, groupName);

  const presentationCount = await prisma.report.count({
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
  if (presentationCount >= monthlyLimit) {
    return {
      allowed: false,
      limit: monthlyLimit,
      current: presentationCount,
      message: `이번 결제 주기 PT레포트 생성 제한(${monthlyLimit}개)을 초과했습니다. 현재 ${presentationCount}개 생성됨.`,
    };
  }

  return {
    allowed: true,
    limit: monthlyLimit,
    current: presentationCount,
  };
}

/**
 * Get user's group policy information
 * @param userId - The user ID
 * @returns Group name, limit, and current usage
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

  const groupName = user.role === 'admin'
    ? 'admin'
    : user.subscription?.plan === 'expert'
      ? 'expert'
      : user.subscription?.plan === 'pro'
        ? 'pro'
        : 'free';

  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  const monthlyLimit = policy?.monthlyProjectLimit ?? (groupName === 'admin' ? 999999 : groupName === 'expert' ? 30 : groupName === 'pro' ? 10 : 3);
  const monthlyPresentationLimit = policy?.monthlyPresentationLimit ?? (groupName === 'admin' ? 999999 : groupName === 'expert' ? 10 : groupName === 'pro' ? 1 : 0);

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

  // Count PT reports for the billing period
  const presentationCount = await prisma.report.count({
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
    monthlyLimit,
    monthlyPresentationLimit,
    currentUsage: usageLog?.count ?? 0,
    currentPresentationUsage: presentationCount,
    remaining: Math.max(0, monthlyLimit - (usageLog?.count ?? 0)),
    remainingPresentation: Math.max(0, monthlyPresentationLimit - presentationCount),
    billingPeriodStart: billingPeriod.start,
    billingPeriodEnd: billingPeriod.end,
  };
}
