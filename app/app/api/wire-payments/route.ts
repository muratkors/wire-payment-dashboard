
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'

export const dynamic = 'force-dynamic'

// Helper function to perform auto-clearing logic
async function performAutoClearing(paymentId: string, payment: any) {
  // Auto-clear if actual amount exactly matches expected amount and payment is pending
  if (
    payment.actualAmount.equals(payment.expectedAmount) && 
    payment.status === 'PENDING' &&
    !payment.autoCleared &&
    !payment.isReverted
  ) {
    // Update payment to AUTO_CLEARED
    await prisma.wirePayment.update({
      where: { id: paymentId },
      data: {
        status: 'AUTO_CLEARED',
        autoCleared: true,
        processedBy: 'system_auto',
        updatedAt: new Date()
      }
    })

    // Create audit log for auto-clearing
    await prisma.auditLog.create({
      data: {
        wirePaymentId: paymentId,
        userId: 'system_auto',
        action: 'AUTO_CLEARED',
        previousValue: 'PENDING',
        newValue: 'AUTO_CLEARED',
        details: `Auto-cleared: Actual amount ($${payment.actualAmount}) matches expected amount ($${payment.expectedAmount})`,
        timestamp: new Date(),
        isRevertible: true
      }
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    // First, fetch all payments
    const wirePayments = await prisma.wirePayment.findMany({
      include: {
        auditLogs: {
          orderBy: {
            timestamp: 'desc'
          }
        },
        contractAllocations: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        actualDateReceived: 'desc'
      }
    })

    // Perform auto-clearing check for eligible payments
    for (const payment of wirePayments) {
      if (
        payment.actualAmount.equals(payment.expectedAmount) && 
        payment.status === 'PENDING' &&
        !payment.autoCleared &&
        !payment.isReverted
      ) {
        await performAutoClearing(payment.id, payment)
      }
    }

    // Fetch updated payments after auto-clearing
    const updatedPayments = await prisma.wirePayment.findMany({
      include: {
        auditLogs: {
          orderBy: {
            timestamp: 'desc'
          }
        },
        contractAllocations: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        actualDateReceived: 'desc'
      }
    })

    return NextResponse.json(updatedPayments)
  } catch (error) {
    console.error('Error fetching wire payments:', error)
    return NextResponse.json(
      { message: 'Failed to fetch wire payments' },
      { status: 500 }
    )
  }
}
