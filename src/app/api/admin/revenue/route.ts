import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

/**
 * GET /api/admin/revenue
 * Get revenue statistics and payment logs
 */
export async function GET(request: Request) {
  const adminCheck = await requireAdmin()
  if (adminCheck instanceof NextResponse) return adminCheck

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'all' // 'all', 'month', 'year'
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1

  try {
    // Get date range based on period
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (period === 'month') {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
    } else if (period === 'year') {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
    }

    // Build where clause
    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.paidAt = {
        gte: startDate,
        lte: endDate
      }
    }

    // Get all payment logs with filters
    const paymentLogs = await prisma.paymentLog.findMany({
      where: whereClause,
      orderBy: { paidAt: 'desc' },
      take: 100 // Limit to latest 100
    })

    // Calculate total revenue by status
    const completedPayments = paymentLogs.filter(p => p.status === 'completed')
    const pendingPayments = paymentLogs.filter(p => p.status === 'pending')
    const refundedPayments = paymentLogs.filter(p => p.status === 'refunded')

    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
    const refundedRevenue = refundedPayments.reduce((sum, p) => sum + p.amount, 0)

    // Group by month for the selected year (if year period is selected)
    const monthlyRevenue: { [key: string]: number } = {}
    if (period === 'year') {
      for (let m = 1; m <= 12; m++) {
        const monthKey = `${year}-${m.toString().padStart(2, '0')}`
        monthlyRevenue[monthKey] = 0
      }

      completedPayments.forEach(payment => {
        if (payment.paidAt) {
          const paidDate = new Date(payment.paidAt)
          const monthKey = `${paidDate.getFullYear()}-${(paidDate.getMonth() + 1).toString().padStart(2, '0')}`
          if (monthlyRevenue[monthKey] !== undefined) {
            monthlyRevenue[monthKey] += payment.amount
          }
        }
      })
    }

    // Group by payment method
    const paymentMethodStats: { [key: string]: { count: number; amount: number } } = {}
    completedPayments.forEach(payment => {
      const method = payment.paymentMethod || 'unknown'
      if (!paymentMethodStats[method]) {
        paymentMethodStats[method] = { count: 0, amount: 0 }
      }
      paymentMethodStats[method].count++
      paymentMethodStats[method].amount += payment.amount
    })

    // Get recent payments with user info
    const recentPayments = await prisma.paymentLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    // Calculate stats
    const stats = {
      totalRevenue,
      pendingRevenue,
      refundedRevenue,
      netRevenue: totalRevenue - refundedRevenue,
      totalTransactions: completedPayments.length,
      pendingTransactions: pendingPayments.length,
      refundedTransactions: refundedPayments.length,
      averageTransaction: completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0,
      monthlyRevenue: period === 'year' ? monthlyRevenue : undefined,
      paymentMethodStats
    }

    return NextResponse.json({
      stats,
      recentPayments,
      period: {
        type: period,
        year,
        month: period === 'month' ? month : undefined
      }
    })
  } catch (error) {
    console.error("Failed to fetch revenue stats:", error)
    return NextResponse.json(
      { error: "매출 통계를 가져오는데 실패했습니다" },
      { status: 500 }
    )
  }
}
