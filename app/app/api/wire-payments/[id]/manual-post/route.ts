
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db'

export const dynamic = 'force-dynamic'

interface ContractAllocation {
  contractId: string
  amount: number
}

interface BackendResponse {
  success: boolean
  totalAmount: number
  contractResults: Array<{
    contractId: string
    amount: number
    transactionId: string
    glAccount: string
    timestamp: string
  }>
  timestamp: string
}

// Simulate backend integration for posting to GL account - supports multiple contracts
async function postToBackendGL(payment: any, contractAllocations: ContractAllocation[], merchantDba: string): Promise<BackendResponse> {
  const backendResults = []
  
  // Process each contract allocation separately
  for (const allocation of contractAllocations) {
    // Simulate API call to backend GL system for each contract
    const backendPayload = {
      contractId: allocation.contractId,
      merchantDba,
      amount: allocation.amount.toString(),
      date: payment.actualDateReceived,
      paymentId: payment.id,
      glAccount: '1100-ACCOUNTS-RECEIVABLE', // Simulate GL account
      description: `Wire payment manual posting for ${merchantDba} - Contract ${allocation.contractId}`
    }

    // Simulate network delay and potential failures
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
    
    // Simulate 5% chance of backend failure for testing (reduced for multi-contract)
    if (Math.random() < 0.05) {
      throw new Error(`Backend GL system temporarily unavailable for contract ${allocation.contractId}`)
    }

    // Simulate successful posting - generate transaction ID
    const transactionId = `GL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    backendResults.push({
      contractId: allocation.contractId,
      amount: allocation.amount,
      transactionId,
      glAccount: backendPayload.glAccount,
      timestamp: new Date().toISOString()
    })
    
    // Small delay between contract postings
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  return {
    success: true,
    totalAmount: contractAllocations.reduce((sum, allocation) => sum + allocation.amount, 0),
    contractResults: backendResults,
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
    const { contractAllocations, merchantDba, notes } = body

    // Support both single contract (legacy) and multiple contracts (new)
    let allocations: ContractAllocation[] = []
    
    if (contractAllocations && Array.isArray(contractAllocations)) {
      // New multi-contract format
      allocations = contractAllocations
    } else if (body.contractId) {
      // Legacy single contract format - convert to array
      allocations = [{
        contractId: body.contractId,
        amount: 0 // Will be set to actual amount below
      }]
    }

    if (!allocations.length || !merchantDba) {
      return NextResponse.json(
        { message: 'Contract allocations and Merchant DBA are required' },
        { status: 400 }
      )
    }

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

    // Check if payment is in valid state for manual posting
    if (currentPayment.isReverted) {
      return NextResponse.json(
        { message: 'Cannot post reverted payment' },
        { status: 400 }
      )
    }

    const actualAmount = Number(currentPayment.actualAmount)

    // For single contract (legacy), set amount to full payment amount
    if (allocations.length === 1 && allocations[0].amount === 0) {
      allocations[0].amount = actualAmount
    }

    // Validate contract allocations
    const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.amount, 0)
    const tolerance = 0.01 // Allow 1 cent tolerance for floating point precision

    if (Math.abs(totalAllocated - actualAmount) > tolerance) {
      return NextResponse.json(
        { 
          message: `Total allocated amount ($${totalAllocated.toFixed(2)}) must equal actual payment amount ($${actualAmount.toFixed(2)})`,
          totalAllocated,
          actualAmount 
        },
        { status: 400 }
      )
    }

    // Validate all contract IDs are provided
    const invalidAllocations = allocations.filter(a => !a.contractId?.trim() || a.amount <= 0)
    if (invalidAllocations.length > 0) {
      return NextResponse.json(
        { message: 'All contract IDs must be provided and amounts must be positive' },
        { status: 400 }
      )
    }

    let backendResponse: BackendResponse | null = null
    
    try {
      // Post to backend GL system with multiple contracts
      backendResponse = await postToBackendGL(currentPayment, allocations, merchantDba)
    } catch (backendError) {
      console.error('Backend posting failed:', backendError)
      
      // Create audit log for failed backend posting
      await prisma.auditLog.create({
        data: {
          wirePaymentId: id,
          userId: 'treasury_user_1',
          action: 'BACKEND_POST_FAILED',
          previousValue: null,
          newValue: null,
          details: `Backend posting failed: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`,
          timestamp: new Date(),
          isRevertible: false
        }
      })

      return NextResponse.json(
        { 
          message: 'Backend posting failed. Please try again later.',
          error: backendError instanceof Error ? backendError.message : 'Unknown error'
        },
        { status: 502 }
      )
    }

    // Create contract allocation records
    const contractAllocData = allocations.map((allocation, index) => ({
      wirePaymentId: id,
      contractId: allocation.contractId,
      amount: allocation.amount,
      percentage: (allocation.amount / actualAmount) * 100,
      glAccount: backendResponse?.contractResults[index]?.glAccount || '1100-ACCOUNTS-RECEIVABLE',
      transactionId: backendResponse?.contractResults[index]?.transactionId,
    }))

    await prisma.contractAllocation.createMany({
      data: contractAllocData
    })

    // Update payment with manual posting information
    const updatedPayment = await prisma.wirePayment.update({
      where: { id },
      data: {
        cid: allocations.length === 1 ? allocations[0].contractId : null, // Keep backward compatibility
        dba: merchantDba,
        status: 'MANUAL_POSTED',
        notesForTreasury: notes || currentPayment.notesForTreasury,
        processedBy: 'treasury_user_1', // In a real app, this would come from auth
        hasMultipleContracts: allocations.length > 1,
        backendTransactionId: allocations.length === 1 ? backendResponse?.contractResults[0]?.transactionId : null,
        updatedAt: new Date()
      }
    })

    // Create comprehensive audit logs for the manual posting
    const contractSummary = allocations.map(a => `${a.contractId}: $${a.amount.toFixed(2)}`).join(', ')
    
    await prisma.auditLog.createMany({
      data: [
        {
          wirePaymentId: id,
          userId: 'treasury_user_1', // In a real app, this would come from auth
          action: 'MANUAL_POST',
          previousValue: null,
          newValue: contractSummary,
          details: `Manual posting completed - ${allocations.length} contract(s): ${contractSummary}`,
          timestamp: new Date(),
          isRevertible: true
        },
        {
          wirePaymentId: id,
          userId: 'treasury_user_1',
          action: 'STATUS_CHANGED',
          previousValue: currentPayment.status,
          newValue: 'MANUAL_POSTED',
          details: 'Status updated after successful manual posting',
          timestamp: new Date(),
          isRevertible: false
        },
        {
          wirePaymentId: id,
          userId: 'treasury_user_1',
          action: 'BACKEND_POST_SUCCESS',
          previousValue: null,
          newValue: JSON.stringify(backendResponse?.contractResults || []),
          details: `Successfully posted ${allocations.length} contract(s) to backend GL system.`,
          timestamp: new Date(),
          isRevertible: true
        }
      ]
    })

    // If DBA was updated, create additional audit log
    if (currentPayment.dba !== merchantDba) {
      await prisma.auditLog.create({
        data: {
          wirePaymentId: id,
          userId: 'treasury_user_1',
          action: 'DBA_UPDATED',
          previousValue: currentPayment.dba,
          newValue: merchantDba,
          details: 'Merchant DBA updated during manual posting',
          timestamp: new Date(),
          isRevertible: false
        }
      })
    }

    // If notes were added/updated, create audit log
    if (notes && notes !== currentPayment.notesForTreasury) {
      await prisma.auditLog.create({
        data: {
          wirePaymentId: id,
          userId: 'treasury_user_1',
          action: 'NOTES_UPDATED',
          previousValue: currentPayment.notesForTreasury,
          newValue: notes,
          details: 'Notes updated during manual posting',
          timestamp: new Date(),
          isRevertible: false
        }
      })
    }

    return NextResponse.json({
      payment: updatedPayment,
      contractAllocations: contractAllocData,
      backendResponse
    })
  } catch (error) {
    console.error('Error processing manual post:', error)
    return NextResponse.json(
      { message: 'Failed to process manual posting' },
      { status: 500 }
    )
  }
}
