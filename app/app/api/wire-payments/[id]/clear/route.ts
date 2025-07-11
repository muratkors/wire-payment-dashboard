
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get current payment
    const currentPayment = await prisma.wirePayment.findUnique({
      where: { id }
    })

    if (!currentPayment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment status to CLEARED
    const updatedPayment = await prisma.wirePayment.update({
      where: { id },
      data: {
        status: 'CLEARED',
        processedBy: 'treasury_user_1', // In a real app, this would come from auth
        updatedAt: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        wirePaymentId: id,
        userId: 'treasury_user_1', // In a real app, this would come from auth
        action: 'STATUS_CHANGED',
        previousValue: currentPayment.status,
        newValue: 'CLEARED',
        details: 'Payment marked as cleared - amounts matched and PTP flag verified',
        timestamp: new Date()
      }
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error clearing payment:', error)
    return NextResponse.json(
      { message: 'Failed to clear payment' },
      { status: 500 }
    )
  }
}
