
'use client'

import { useState } from 'react'
import { WirePayment } from '@prisma/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'
import { X, DollarSign, Calendar, Building, AlertTriangle, CheckCircle, Loader, Plus, Trash2, Calculator } from 'lucide-react'
import { toast } from 'sonner'

interface ContractAllocation {
  id: string
  contractId: string
  amount: string
}

interface WirePaymentWithLogs extends WirePayment {
  auditLogs: Array<{
    id: string
    userId: string
    action: string
    previousValue: string | null
    newValue: string | null
    details: string | null
    timestamp: Date
    isRevertible: boolean
    revertedAt: Date | null
    revertedBy: string | null
  }>
}

interface ManualPostingModalProps {
  payment: WirePaymentWithLogs
  onClose: () => void
  onComplete: () => void
}

export function ManualPostingModal({
  payment,
  onClose,
  onComplete,
}: ManualPostingModalProps) {
  // Initialize with one contract allocation
  const [contractAllocations, setContractAllocations] = useState<ContractAllocation[]>([
    { id: '1', contractId: '', amount: '' }
  ])
  const [merchantDba, setMerchantDba] = useState(payment.dba || '')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'idle' | 'posting' | 'success' | 'error'>('idle')
  const [backendError, setBackendError] = useState('')
  const [backendResponse, setBackendResponse] = useState<any>(null)
  
  const actualAmount = Number(payment.actualAmount)

  // Helper functions for managing contract allocations
  const addContractAllocation = () => {
    const newId = (contractAllocations.length + 1).toString()
    setContractAllocations([...contractAllocations, { id: newId, contractId: '', amount: '' }])
  }

  const removeContractAllocation = (id: string) => {
    if (contractAllocations.length > 1) {
      setContractAllocations(contractAllocations.filter(allocation => allocation.id !== id))
    }
  }

  const updateContractAllocation = (id: string, field: 'contractId' | 'amount', value: string) => {
    setContractAllocations(contractAllocations.map(allocation =>
      allocation.id === id ? { ...allocation, [field]: value } : allocation
    ))
  }

  // Calculate total allocated amount
  const totalAllocated = contractAllocations.reduce((sum, allocation) => {
    const amount = parseFloat(allocation.amount) || 0
    return sum + amount
  }, 0)

  const remainingAmount = actualAmount - totalAllocated
  const isValidAllocation = Math.abs(remainingAmount) < 0.01 // Allow 1 cent tolerance

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate contract allocations
    const invalidAllocations = contractAllocations.filter(allocation => 
      !allocation.contractId.trim() || !allocation.amount.trim() || parseFloat(allocation.amount) <= 0
    )
    
    if (invalidAllocations.length > 0) {
      toast.error('All contract IDs and amounts must be provided and amounts must be positive')
      return
    }
    
    if (!merchantDba.trim()) {
      toast.error('Merchant DBA is required')
      return
    }

    if (!isValidAllocation) {
      toast.error(`Total allocated amount must equal actual payment amount ($${actualAmount.toFixed(2)})`)
      return
    }

    // Show confirmation dialog
    setShowConfirmation(true)
  }

  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true)
    setBackendStatus('posting')
    setBackendError('')
    
    try {
      // Convert contract allocations to the format expected by the API
      const contractAllocationsData = contractAllocations.map(allocation => ({
        contractId: allocation.contractId.trim(),
        amount: parseFloat(allocation.amount)
      }))

      const response = await fetch(`/api/wire-payments/${payment.id}/manual-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractAllocations: contractAllocationsData,
          merchantDba: merchantDba.trim(),
          notes: notes.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setBackendStatus('success')
        setBackendResponse(data.backendResponse)
        toast.success(`Manual posting completed successfully! ${contractAllocations.length} contract(s) allocated.`)
        
        // Auto-close after 2 seconds to show success
        setTimeout(() => {
          onComplete()
        }, 2000)
      } else {
        setBackendStatus('error')
        setBackendError(data.message || 'Failed to complete manual posting')
        toast.error(data.message || 'Failed to complete manual posting')
      }
    } catch (error) {
      console.error('Error submitting manual post:', error)
      setBackendStatus('error')
      setBackendError('Network error occurred')
      toast.error('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (backendStatus === 'success') {
      onComplete()
    } else {
      setShowConfirmation(false)
      setBackendStatus('idle')
      setBackendError('')
    }
  }

  const formatAmount = (amount: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Manual Payment Posting</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Payment Information */}
          <Card className="p-4 mb-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Current DBA</div>
                  <div className="font-medium">{payment.dba}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Actual Amount</div>
                  <div className="font-medium text-lg text-green-600">
                    {formatAmount(payment.actualAmount)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Date Received</div>
                  <div className="font-medium">{formatDate(payment.actualDateReceived)}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Current Status</div>
                <div className="font-medium text-orange-600">{payment.status.replace('_', ' ')}</div>
              </div>
            </div>
          </Card>

          {/* Backend Status Display */}
          {backendStatus !== 'idle' && (
            <Card className="p-4 mb-6">
              <div className="flex items-center space-x-3">
                {backendStatus === 'posting' && (
                  <>
                    <Loader className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">Posting to Backend System</div>
                      <div className="text-sm text-blue-600">Connecting to GL system and processing transaction...</div>
                    </div>
                  </>
                )}
                {backendStatus === 'success' && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900">Successfully Posted to Backend</div>
                      <div className="text-sm text-green-600">
                        Transaction ID: {backendResponse?.transactionId}
                      </div>
                      <div className="text-sm text-green-600">
                        GL Account: {backendResponse?.glAccount}
                      </div>
                    </div>
                  </>
                )}
                {backendStatus === 'error' && (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-900">Backend Posting Failed</div>
                      <div className="text-sm text-red-600">{backendError}</div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {!showConfirmation ? (
            /* Multi-Contract Allocation Form */
            <form onSubmit={handleInitialSubmit} className="space-y-6">
              {/* Wire Amount Display */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">Wire Payment Amount</h4>
                      <p className="text-sm text-blue-700">Total amount to be allocated across contracts</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatAmount(actualAmount)}
                  </div>
                </div>
              </Card>

              {/* Contract Allocations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Contract Allocations</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContractAllocation}
                    disabled={isSubmitting}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Contract</span>
                  </Button>
                </div>

                {contractAllocations.map((allocation, index) => (
                  <Card key={allocation.id} className="p-4 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-700">Contract {index + 1}</h5>
                      {contractAllocations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContractAllocation(allocation.id)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`contract-id-${allocation.id}`} className="text-sm font-medium text-gray-700">
                          Contract ID *
                        </Label>
                        <Input
                          id={`contract-id-${allocation.id}`}
                          type="text"
                          placeholder="e.g., TC-2024-001"
                          value={allocation.contractId}
                          onChange={(e) => updateContractAllocation(allocation.id, 'contractId', e.target.value)}
                          disabled={isSubmitting}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`amount-${allocation.id}`} className="text-sm font-medium text-gray-700">
                          Amount *
                        </Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id={`amount-${allocation.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={allocation.amount}
                            onChange={(e) => updateContractAllocation(allocation.id, 'amount', e.target.value)}
                            disabled={isSubmitting}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Allocation Summary */}
              <Card className={`p-4 ${isValidAllocation ? 'bg-green-50 border-green-200' : remainingAmount !== 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calculator className={`h-5 w-5 ${isValidAllocation ? 'text-green-600' : remainingAmount !== 0 ? 'text-red-600' : 'text-gray-600'}`} />
                    <div>
                      <h4 className={`font-medium ${isValidAllocation ? 'text-green-900' : remainingAmount !== 0 ? 'text-red-900' : 'text-gray-900'}`}>
                        Allocation Summary
                      </h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between w-48">
                          <span className="text-gray-600">Total Allocated:</span>
                          <span className="font-medium">{formatAmount(totalAllocated)}</span>
                        </div>
                        <div className="flex justify-between w-48">
                          <span className="text-gray-600">Remaining:</span>
                          <span className={`font-medium ${remainingAmount === 0 ? 'text-green-600' : remainingAmount > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                            {formatAmount(remainingAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isValidAllocation ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : remainingAmount !== 0 ? (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  ) : null}
                </div>
                
                {!isValidAllocation && remainingAmount !== 0 && (
                  <div className="mt-2 text-sm text-red-700">
                    {remainingAmount > 0 
                      ? `Please allocate the remaining ${formatAmount(remainingAmount)} to complete the allocation.`
                      : `Total allocation exceeds wire amount by ${formatAmount(Math.abs(remainingAmount))}. Please adjust amounts.`
                    }
                  </div>
                )}
              </Card>

              {/* Merchant DBA */}
              <div>
                <Label htmlFor="merchant-dba" className="text-sm font-medium text-gray-700">
                  Merchant DBA *
                </Label>
                <Input
                  id="merchant-dba"
                  type="text"
                  placeholder="Enter merchant DBA name"
                  value={merchantDba}
                  onChange={(e) => setMerchantDba(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Confirm or update the merchant DBA name for all contracts
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this multi-contract allocation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValidAllocation}
                  className={`${isValidAllocation ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'} text-white`}
                >
                  Review & Post {contractAllocations.length} Contract{contractAllocations.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </form>
          ) : (
            /* Confirmation Dialog */
            <div className="space-y-4">
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900">Confirm Multi-Contract Posting</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This action will post {contractAllocations.length} contract allocation{contractAllocations.length !== 1 ? 's' : ''} to the backend GL system and cannot be easily undone. 
                      Please review the details below before confirming.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Contract Allocations</h4>
                <div className="space-y-3">
                  {contractAllocations.map((allocation, index) => (
                    <div key={allocation.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Contract {index + 1}</span>
                        <span className="font-medium text-green-600">
                          {formatAmount(parseFloat(allocation.amount) || 0)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Contract ID:</span>
                          <span className="font-medium">{allocation.contractId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Percentage:</span>
                          <span className="font-medium">
                            {((parseFloat(allocation.amount) || 0) / actualAmount * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Allocated:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatAmount(totalAllocated)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Additional Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Merchant DBA:</span>
                    <span className="font-medium">{merchantDba}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Contracts:</span>
                    <span className="font-medium">{contractAllocations.length}</span>
                  </div>
                  {notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600 block">Notes:</span>
                      <span className="font-medium">{notes}</span>
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  {backendStatus === 'success' ? 'Close' : 'Back'}
                </Button>
                {backendStatus !== 'success' && (
                  <Button
                    type="button"
                    onClick={handleConfirmedSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      'Confirm & Post to Backend'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
