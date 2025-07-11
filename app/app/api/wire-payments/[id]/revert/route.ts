

import { NextRequest, NextResponse } from 'next/server'
import { PaymentStatus } from '@prisma/client'
import { prisma } from '../../../../../lib/db'

export const dynamic = 'force-dynamic'

// Simulate backend reversal for GL transactions
async function revertBackendTransaction(transactionId: string, payment: any) {
  // Simulate API call to backend GL system for reversal
  const reversalPayload = {
    originalTransactionId: transactionId,
    amount: payment.actualAmount.toString(),
    reversalDate: new Date().toISOString(),
    reason: 'Manual reversal requested by treasury user'
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
  
  // Simulate 5% chance of backend reversal failure
  if (Math.random() < 0.05) {
    throw new Error('Backend reversal system temporarily unavailable')
  }

  // Generate reversal transaction ID
  const reversalTransactionId = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  return {
    success: true,
    reversalTransactionId,
    originalTransactionId: transactionId,
    timestamp: new Date().toISOString()
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { auditLogId, reason } = body

    if (!auditLogId) {
      return NextResponse.json(
        { message: 'Audit log ID is required for reversal' },
        { status: 400 }
      )
    }

    // Get current payment
    const currentPayment = await prisma.wirePayment.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    if (!currentPayment) {
      return NextResponse.json(
        { message: 'Payment not found' },
        { status: 404 }
      )
    }

    // Find the specific audit log to revert
    const auditLogToRevert = currentPayment.auditLogs.find(log => log.id === auditLogId)
    
    if (!auditLogToRevert) {
      return NextResponse.json(
        { message: 'Audit log not found' },
        { status: 404 }
      )
    }

    // Check if the audit log is revertible
    if (!auditLogToRevert.isRevertible) {
      return NextResponse.json(
        { message: 'This action cannot be reverted' },
        { status: 400 }
      )
    }

    // Check if already reverted
    if (auditLogToRevert.revertedAt) {
      return NextResponse.json(
        { message: 'This action has already been reverted' },
        { status: 400 }
      )
    }

    // Check if payment is already reverted
    if (currentPayment.isReverted) {
      return NextResponse.json(
        { message: 'Payment has already been reverted' },
        { status: 400 }
      )
    }

    // Validate revertible actions
    const revertibleActions = ['MANUAL_POST', 'AUTO_CLEARED', 'CLEARED', 'BACKEND_POST_SUCCESS']
    if (!revertibleActions.includes(auditLogToRevert.action)) {
      return NextResponse.json(
        { message: `Action '${auditLogToRevert.action}' cannot be reverted` },
        { status: 400 }
      )
    }

    let backendReversalResponse = null

    // If reverting a backend transaction, call backend reversal API
    if (auditLogToRevert.action === 'BACKEND_POST_SUCCESS' && currentPayment.backendTransactionId) {
      try {
        backendReversalResponse = await revertBackendTransaction(
          currentPayment.backendTransactionId, 
          currentPayment
        )
      } catch (backendError) {
        console.error('Backend reversal failed:', backendError)
        
        // Create audit log for failed backend reversal
        await prisma.auditLog.create({
          data: {
            wirePaymentId: id,
            userId: 'treasury_user_1',
            action: 'BACKEND_REVERSAL_FAILED',
            previousValue: null,
            newValue: null,
            details: `Backend reversal failed: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`,
            timestamp: new Date(),
            isRevertible: false
          }
        })

        return NextResponse.json(
          { 
            message: 'Backend reversal failed. Please contact system administrator.',
            error: backendError instanceof Error ? backendError.message : 'Unknown error'
          },
          { status: 502 }
        )
      }
    }

    // Determine new status based on what's being reverted
    let newStatus: PaymentStatus = PaymentStatus.PENDING
    if (auditLogToRevert.action === 'AUTO_CLEARED') {
      newStatus = PaymentStatus.PENDING
    } else if (auditLogToRevert.action === 'CLEARED') {
      newStatus = PaymentStatus.PENDING
    } else if (auditLogToRevert.action === 'MANUAL_POST' || auditLogToRevert.action === 'BACKEND_POST_SUCCESS') {
      newStatus = PaymentStatus.REVERTED
    }

    // Update the specific audit log as reverted
    await prisma.auditLog.update({
      where: { id: auditLogId },
      data: {
        revertedAt: new Date(),
        revertedBy: 'treasury_user_1'
      }
    })

    // Update payment status and reversal information
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
      processedBy: 'treasury_user_1'
    }

    // If this is a full payment reversal (not just status change)
    if (newStatus === PaymentStatus.REVERTED) {
      updateData.isReverted = true
      updateData.originalStatus = currentPayment.status
      updateData.revertedAt = new Date()
      updateData.revertedBy = 'treasury_user_1'
    }

    // If reverting auto-clear, reset the auto-cleared flag
    if (auditLogToRevert.action === 'AUTO_CLEARED') {
      updateData.autoCleared = false
    }

    const updatedPayment = await prisma.wirePayment.update({
      where: { id },
      data: updateData
    })

    // Create comprehensive audit logs for the reversal
    const auditLogs = [
      {
        wirePaymentId: id,
        userId: 'treasury_user_1',
        action: 'REVERTED',
        previousValue: currentPayment.status.toString(),
        newValue: newStatus.toString(),
        details: `Reverted action: ${auditLogToRevert.action}. Reason: ${reason || 'No reason provided'}`,
        timestamp: new Date(),
        isRevertible: false
      },
      {
        wirePaymentId: id,
        userId: 'treasury_user_1',
        action: 'STATUS_CHANGED',
        previousValue: currentPayment.status.toString(),
        newValue: newStatus.toString(),
        details: `Status changed due to reversal of ${auditLogToRevert.action}`,
        timestamp: new Date(),
        isRevertible: false
      }
    ]

    // Add backend reversal log if applicable
    if (backendReversalResponse) {
      auditLogs.push({
        wirePaymentId: id,
        userId: 'treasury_user_1',
        action: 'BACKEND_REVERSAL_SUCCESS',
        previousValue: currentPayment.backendTransactionId || '',
        newValue: backendReversalResponse.reversalTransactionId,
        details: `Backend transaction reversed. Original ID: ${currentPayment.backendTransactionId || 'N/A'}, Reversal ID: ${backendReversalResponse.reversalTransactionId}`,
        timestamp: new Date(),
        isRevertible: false
      })
    }

    await prisma.auditLog.createMany({
      data: auditLogs
    })

    return NextResponse.json({
      payment: updatedPayment,
      revertedAction: auditLogToRevert.action,
      backendReversalResponse
    })
  } catch (error) {
    console.error('Error processing reversal:', error)
    return NextResponse.json(
      { message: 'Failed to process reversal' },
      { status: 500 }
    )
  }
}

