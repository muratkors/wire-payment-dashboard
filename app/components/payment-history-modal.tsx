
'use client'

import { useState } from 'react'
import { WirePayment } from '@prisma/client'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog'
import { Textarea } from './ui/textarea'
import { X, Clock, User, FileText, TrendingUp, RotateCcw, AlertTriangle, CheckCircle, Loader, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

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
  contractAllocations?: Array<{
    id: string
    contractId: string
    amount: any
    percentage: any
    glAccount: string | null
    transactionId: string | null
    createdAt: Date
    updatedAt: Date
  }>
}

interface PaymentHistoryModalProps {
  payment: WirePaymentWithLogs
  onClose: () => void
  onPaymentUpdate?: () => void
}

export function PaymentHistoryModal({ payment, onClose, onPaymentUpdate }: PaymentHistoryModalProps) {
  const [showRevertConfirm, setShowRevertConfirm] = useState(false)
  const [selectedLogForRevert, setSelectedLogForRevert] = useState<string | null>(null)
  const [revertReason, setRevertReason] = useState('')
  const [isReverting, setIsReverting] = useState(false)

  const handleRevertAction = async (auditLogId: string) => {
    setSelectedLogForRevert(auditLogId)
    setShowRevertConfirm(true)
  }

  const confirmRevert = async () => {
    if (!selectedLogForRevert) return

    setIsReverting(true)
    try {
      const response = await fetch(`/api/wire-payments/${payment.id}/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auditLogId: selectedLogForRevert,
          reason: revertReason || 'No reason provided'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to revert action')
      }

      const data = await response.json()
      toast.success(`Successfully reverted ${data.revertedAction.replace('_', ' ').toLowerCase()}`)
      
      // Close dialog and reset state
      setShowRevertConfirm(false)
      setSelectedLogForRevert(null)
      setRevertReason('')
      
      // Notify parent to refresh data
      if (onPaymentUpdate) {
        onPaymentUpdate()
      }

    } catch (error) {
      console.error('Revert failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to revert action')
    } finally {
      setIsReverting(false)
    }
  }

  const cancelRevert = () => {
    setShowRevertConfirm(false)
    setSelectedLogForRevert(null)
    setRevertReason('')
  }
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date))
  }

  const formatAmount = (amount: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount))
  }

  const getActionIcon = (action: string, isReverted?: boolean) => {
    if (isReverted) {
      return <RotateCcw className="h-4 w-4" />
    }
    
    switch (action) {
      case 'STATUS_CHANGED':
        return <TrendingUp className="h-4 w-4" />
      case 'MANUAL_POST':
        return <FileText className="h-4 w-4" />
      case 'AUTO_CLEARED':
        return <CheckCircle className="h-4 w-4" />
      case 'BACKEND_POST_SUCCESS':
        return <CheckCircle className="h-4 w-4" />
      case 'CLEARED':
        return <CheckCircle className="h-4 w-4" />
      case 'NOTES_UPDATED':
        return <FileText className="h-4 w-4" />
      case 'REVERTED':
        return <RotateCcw className="h-4 w-4" />
      case 'BACKEND_REVERSAL_SUCCESS':
        return <RotateCcw className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string, isReverted?: boolean) => {
    if (isReverted) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    
    switch (action) {
      case 'STATUS_CHANGED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'MANUAL_POST':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'AUTO_CLEARED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'BACKEND_POST_SUCCESS':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CLEARED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'NOTES_UPDATED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REVERTED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'BACKEND_REVERSAL_SUCCESS':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Sort audit logs by timestamp (newest first)
  const sortedLogs = [...payment.auditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Payment History & Audit Trail</h2>
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
          {/* Payment Summary */}
          <Card className="p-4 mb-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">DBA</div>
                <div className="font-medium">{payment.dba}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Contract ID</div>
                <div className="font-medium">{payment.cid || (payment.hasMultipleContracts ? 'Multiple Contracts' : 'N/A')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Current Status</div>
                <div>
                  <Badge className={
                    payment.status === 'CLEARED' ? 'bg-green-100 text-green-800' :
                    payment.status === 'AUTO_CLEARED' ? 'bg-green-100 text-green-800' :
                    payment.status === 'MANUAL_POSTED' ? 'bg-blue-100 text-blue-800' :
                    payment.status === 'UNCLEARED' ? 'bg-red-100 text-red-800' :
                    payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    payment.status === 'REVIEW_REQUIRED' ? 'bg-orange-100 text-orange-800' :
                    payment.status === 'REVERTED' ? 'bg-gray-400 text-white' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {payment.isReverted ? (
                      <div className="flex items-center space-x-1">
                        <RotateCcw className="h-3 w-3" />
                        <span>REVERTED</span>
                      </div>
                    ) : (
                      payment.status.replace('_', ' ')
                    )}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Expected Amount</div>
                <div className="font-medium">{formatAmount(payment.expectedAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Actual Amount</div>
                <div className="font-medium text-lg">{formatAmount(payment.actualAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">PTP Status</div>
                <div>
                  <Badge className={payment.ptp ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {payment.ptp ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contract Allocations */}
            {payment.contractAllocations && payment.contractAllocations.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Contract Allocations</h4>
                <div className="space-y-2">
                  {payment.contractAllocations.map((allocation, index) => (
                    <div key={allocation.id} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{allocation.contractId}</div>
                          <div className="text-sm text-gray-500">
                            {Number(allocation.percentage).toFixed(1)}% of total payment
                            {allocation.transactionId && (
                              <span className="ml-2 text-xs text-blue-600">
                                TX: {allocation.transactionId}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="font-medium text-green-600">
                          {formatAmount(allocation.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payment.notesForTreasury && (
              <div className="mt-4">
                <div className="text-sm text-gray-500">Current Notes</div>
                <div className="text-sm bg-white p-2 rounded border">
                  {payment.notesForTreasury}
                </div>
              </div>
            )}
          </Card>

          {/* Audit Trail */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Trail</h3>
            
            {sortedLogs.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No audit history available for this payment.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {sortedLogs.map((log, index) => (
                  <Card key={log.id} className={`p-4 ${log.revertedAt ? 'border-red-200 bg-red-50' : ''}`}>
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${getActionColor(log.action, !!log.revertedAt)}`}>
                        {getActionIcon(log.action, !!log.revertedAt)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getActionColor(log.action, !!log.revertedAt)}>
                              {log.action.replace('_', ' ')}
                              {log.revertedAt && (
                                <span className="ml-1 text-xs">(REVERTED)</span>
                              )}
                            </Badge>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <User className="h-3 w-3" />
                              <span>{log.userId}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-gray-500">
                              {formatDate(log.timestamp)}
                            </div>
                            {/* Show revert button for revertible actions that haven't been reverted */}
                            {log.isRevertible && !log.revertedAt && !payment.isReverted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevertAction(log.id)}
                                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                                disabled={isReverting}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Revert
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {log.details && (
                          <div className="mt-2 text-sm text-gray-700">
                            {log.details}
                          </div>
                        )}
                        
                        {(log.previousValue || log.newValue) && (
                          <div className="mt-2 text-xs">
                            {log.previousValue && (
                              <div className="text-red-600">
                                Previous: {log.previousValue}
                              </div>
                            )}
                            {log.newValue && (
                              <div className="text-green-600">
                                New: {log.newValue}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Show revert information if this action was reverted */}
                        {log.revertedAt && (
                          <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                            <div className="flex items-center space-x-1 text-xs text-red-700">
                              <RotateCcw className="h-3 w-3" />
                              <span>
                                Reverted on {formatDate(log.revertedAt)} by {log.revertedBy}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      {/* Revert Confirmation Dialog */}
      <Dialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <span>Confirm Revert Action</span>
            </DialogTitle>
            <DialogDescription>
              This action will revert the selected audit log entry and may change the payment status. 
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="revert-reason">Reason for Revert (Optional)</Label>
              <Textarea
                id="revert-reason"
                placeholder="Enter reason for reverting this action..."
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={cancelRevert}
              disabled={isReverting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRevert}
              disabled={isReverting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isReverting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Reverting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirm Revert
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
