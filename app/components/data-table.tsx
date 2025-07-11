
'use client'

import { useState } from 'react'
import { WirePayment, PaymentStatus } from '@prisma/client'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card } from './ui/card'
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Eye, 
  Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown 
} from 'lucide-react'

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

interface DataTableProps {
  payments: WirePaymentWithLogs[]
  loading: boolean
  onMarkAsCleared: (paymentId: string) => void
  onManualPost: (payment: WirePaymentWithLogs) => void
  onViewHistory: (payment: WirePaymentWithLogs) => void
}

type SortKey = 'dba' | 'cid' | 'actualAmount' | 'actualDateReceived' | 'status'
type SortDirection = 'asc' | 'desc' | null

export function DataTable({
  payments,
  loading,
  onMarkAsCleared,
  onManualPost,
  onViewHistory,
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc')
      if (sortDirection === 'desc') {
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  const sortedPayments = [...payments].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0

    let aValue: any = a[sortKey]
    let bValue: any = b[sortKey]

    if (sortKey === 'actualAmount') {
      aValue = Number(aValue)
      bValue = Number(bValue)
    } else if (sortKey === 'actualDateReceived') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    } else if (typeof aValue === 'string') {
      aValue = aValue?.toLowerCase() || ''
      bValue = bValue?.toLowerCase() || ''
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getStatusBadge = (status: PaymentStatus, autoCleared?: boolean) => {
    const statusConfig = {
      CLEARED: { 
        color: 'bg-green-500 text-white border-green-200', 
        icon: CheckCircle 
      },
      AUTO_CLEARED: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle 
      },
      UNCLEARED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: AlertCircle 
      },
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock 
      },
      REVIEW_REQUIRED: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: AlertCircle 
      },
      MANUAL_POSTED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: Edit3 
      },
      REVERTED: { 
        color: 'bg-gray-400 text-white border-gray-200', 
        icon: AlertCircle 
      },
    }

    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{status.replace('_', ' ')}</span>
        {autoCleared && status === 'AUTO_CLEARED' && (
          <span className="text-xs ml-1">(Auto)</span>
        )}
      </Badge>
    )
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

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading payments...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dba')}
              >
                <div className="flex items-center space-x-1">
                  <span>DBA</span>
                  {getSortIcon('dba')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cid')}
              >
                <div className="flex items-center space-x-1">
                  <span>Contract ID</span>
                  {getSortIcon('cid')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Amount
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('actualAmount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Actual Amount</span>
                  {getSortIcon('actualAmount')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PTP
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('actualDateReceived')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date Received</span>
                  {getSortIcon('actualDateReceived')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {payment.dba}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payment.contractAllocations && payment.contractAllocations.length > 0 ? (
                      payment.contractAllocations.length === 1 ? (
                        <div>
                          <div className="font-medium">{payment.contractAllocations[0].contractId}</div>
                          <div className="text-xs text-gray-500">Single Contract</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-blue-600">Multiple Contracts</div>
                          <div className="text-xs text-gray-500">{payment.contractAllocations.length} allocations</div>
                        </div>
                      )
                    ) : payment.cid ? (
                      <div>
                        <div className="font-medium">{payment.cid}</div>
                        <div className="text-xs text-gray-500">Legacy Contract</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatAmount(payment.expectedAmount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatAmount(payment.actualAmount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={payment.ptp ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {payment.ptp ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(payment.status, payment.autoCleared)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(payment.actualDateReceived)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {/* Only show Clear button if amounts don't match (won't auto-clear) and payment is eligible */}
                    {payment.ptp && 
                     payment.status === 'PENDING' && 
                     !payment.actualAmount?.equals?.(payment.expectedAmount) &&
                     !payment.isReverted && (
                      <Button
                        size="sm"
                        onClick={() => onMarkAsCleared(payment.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                    
                    {/* Show manual post for payments that need review or are uncleared and aren't reverted */}
                    {(payment.status === 'REVIEW_REQUIRED' || payment.status === 'UNCLEARED') && 
           
                     !payment.isReverted && (
                      <Button
                        size="sm"
                        onClick={() => onManualPost(payment)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Manual Post
                      </Button>
                    )}
                    
                    {/* Auto-cleared status indicator */}
                    {payment.status === 'AUTO_CLEARED' && (
                      <div className="text-xs text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Auto-matched
                      </div>
                    )}
                    
                    {/* Reverted status indicator */}
                    {payment.isReverted && (
                      <div className="text-xs text-gray-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Reverted
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewHistory(payment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      History
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {sortedPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments found matching your criteria.</p>
          </div>
        )}
      </div>
    </Card>
  )
}
