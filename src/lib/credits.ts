/* 크레딧 기능 비활성화
import prisma from './prisma';

export type CreditTransactionType =
  | 'purchase'
  | 'admin_grant'
  | 'admin_deduct'
  | 'analysis_cost'
  | 'presentation_cost';

/**
 * Add or deduct credits from a user
 * @param userId - User ID
 * @param amount - Amount to add (positive) or deduct (negative)
 * @param type - Type of transaction
 * @param description - Transaction description
 * @param relatedId - Related entity ID (project, payment, etc.)
 * @param adminId - Admin who performed the transaction (if applicable)
 * @returns Updated user credits and transaction record
 */
export async function modifyUserCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description?: string,
  relatedId?: string,
  adminId?: string
) {
  // Get current user credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const newBalance = user.credits + amount;

  if (newBalance < 0) {
    throw new Error('Insufficient credits');
  }

  // Update user credits and create transaction in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update user credits
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { credits: newBalance },
    });

    // Create transaction record
    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
        relatedId,
        adminId,
        balanceAfter: newBalance,
      },
    });

    return { user: updatedUser, transaction };
  });

  return result;
}

/**
 * Check if user has enough credits
 * @param userId - User ID
 * @param requiredCredits - Required credits
 * @returns Boolean indicating if user has enough credits
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    return false;
  }

  return user.credits >= requiredCredits;
}

/**
 * Get credit price for a service
 * @param type - Service type (basic_analysis, premium_presentation)
 * @returns Credit price
 */
export async function getCreditPrice(type: string): Promise<number> {
  const price = await prisma.creditPrice.findUnique({
    where: { type },
    select: { credits: true, isActive: true },
  });

  if (!price || !price.isActive) {
    // Return default prices if not configured
    const defaultPrices: { [key: string]: number } = {
      basic_analysis: 10,
      premium_presentation: 50,
    };
    return defaultPrices[type] || 0;
  }

  return price.credits;
}

/**
 * Deduct credits for an analysis
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns Transaction result
 */
export async function deductAnalysisCredits(userId: string, projectId: string) {
  const creditCost = await getCreditPrice('basic_analysis');

  return await modifyUserCredits(
    userId,
    -creditCost,
    'analysis_cost',
    '기본 분석 비용',
    projectId
  );
}

/**
 * Deduct credits for premium presentation
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns Transaction result
 */
export async function deductPresentationCredits(userId: string, projectId: string) {
  const creditCost = await getCreditPrice('premium_presentation');

  return await modifyUserCredits(
    userId,
    -creditCost,
    'presentation_cost',
    '고급 프레젠테이션 제작 비용',
    projectId
  );
}
*/