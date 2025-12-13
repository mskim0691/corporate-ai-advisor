import prisma from './prisma';
import { getCurrentYearMonth } from './utils';

export interface PolicyCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  message?: string;
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
  } else if (subscriptionPlan === 'pro') {
    groupName = 'pro';
  }

  // Fetch the policy for this group
  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  // If no policy exists, use default limits
  const monthlyLimit = policy?.monthlyProjectLimit ?? (groupName === 'admin' ? 999999 : groupName === 'pro' ? 10 : 3);

  // Get current month's usage
  const yearMonth = getCurrentYearMonth();
  const usageLog = await prisma.usageLog.findUnique({
    where: {
      userId_yearMonth: {
        userId,
        yearMonth,
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
      message: `이번 달 프로젝트 생성 제한(${monthlyLimit}개)을 초과했습니다. 현재 ${currentUsage}개 생성됨.`,
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
  } else if (subscriptionPlan === 'pro') {
    groupName = 'pro';
  }

  // Fetch the policy for this group
  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  // If no policy exists, use default limits
  const monthlyLimit = policy?.monthlyPresentationLimit ?? (groupName === 'admin' ? 999999 : groupName === 'pro' ? 1 : 0);

  // Get current month's presentation report count
  const yearMonth = getCurrentYearMonth();
  const startOfMonth = new Date(`${yearMonth}-01`);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

  const presentationCount = await prisma.report.count({
    where: {
      reportType: 'presentation',
      project: {
        userId,
      },
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  // Check if user has exceeded their limit
  if (presentationCount >= monthlyLimit) {
    return {
      allowed: false,
      limit: monthlyLimit,
      current: presentationCount,
      message: `이번 달 PT레포트 생성 제한(${monthlyLimit}개)을 초과했습니다. 현재 ${presentationCount}개 생성됨.`,
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

  const groupName = user.role === 'admin' ? 'admin' : user.subscription?.plan === 'pro' ? 'pro' : 'free';

  const policy = await prisma.groupPolicy.findUnique({
    where: { groupName },
  });

  const monthlyLimit = policy?.monthlyProjectLimit ?? (groupName === 'admin' ? 999999 : groupName === 'pro' ? 10 : 3);
  const monthlyPresentationLimit = policy?.monthlyPresentationLimit ?? (groupName === 'admin' ? 999999 : groupName === 'pro' ? 1 : 0);

  const yearMonth = getCurrentYearMonth();
  const usageLog = await prisma.usageLog.findUnique({
    where: {
      userId_yearMonth: {
        userId,
        yearMonth,
      },
    },
  });

  // Count PT reports for current month
  const startOfMonth = new Date(`${yearMonth}-01`);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

  const presentationCount = await prisma.report.count({
    where: {
      reportType: 'presentation',
      project: {
        userId,
      },
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
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
  };
}
