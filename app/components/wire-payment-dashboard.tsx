
'use client'

import { useState, useEffect } from 'react'
import { WirePayment, PaymentStatus } from '@prisma/client'
import { DataTable } from './data-table'
import { FilterBar } from './filter-bar'
import { Header } from './header'
import { ManualPostingModal } from './manual-posting-modal'
import { PaymentHistoryModal } from './payment-history-modal'
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

interface FilterState {
  dba: string
  cid: string
  status: PaymentStatus | 'ALL'
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

export function WirePaymentDashboard() {
  const [payments, setPayments] = useState<WirePaymentWithLogs[]>([])
  const [filteredPayments, setFilteredPayments] = useState<WirePaymentWithLogs[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<WirePaymentWithLogs | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    dba: '',
    cid: '',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  })

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wire-payments')
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }
      const data = await response.json()
      setPayments(data)
      setFilteredPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load wire payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, filters])

  const filterPayments = () => {
    let filtered = payments

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.dba?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.cid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // DBA filter
    if (filters.dba) {
      filtered = filtered.filter(payment =>
        payment.dba?.toLowerCase().includes(filters.dba.toLowerCase())
      )
    }

    // Contract ID filter
    if (filters.cid) {
      filtered = filtered.filter(payment =>
        payment.cid?.toLowerCase().includes(filters.cid.toLowerCase())
      )
    }

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(payment => payment.status === filters.status)
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(payment => {
        const paymentDate = payment.actualDateReceived ? new Date(payment.actualDateReceived) : null
        return paymentDate && paymentDate >= fromDate
      })
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(payment => {
        const paymentDate = payment.actualDateReceived ? new Date(payment.actualDateReceived) : null
        return paymentDate && paymentDate <= toDate
      })
    }

    // Amount range filter
    if (filters.amountMin) {
      const minAmount = parseFloat(filters.amountMin)
      filtered = filtered.filter(payment => Number(payment.actualAmount) >= minAmount)
    }

    if (filters.amountMax) {
      const maxAmount = parseFloat(filters.amountMax)
      filtered = filtered.filter(payment => Number(payment.actualAmount) <= maxAmount)
    }

    setFilteredPayments(filtered)
  }

  const handleManualPost = (payment: WirePaymentWithLogs) => {
    setSelectedPayment(payment)
    setShowManualModal(true)
  }

  const handleViewHistory = (payment: WirePaymentWithLogs) => {
    setSelectedPayment(payment)
    setShowHistoryModal(true)
  }

  const handleMarkAsCleared = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/wire-payments/${paymentId}/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to mark payment as cleared')
      }

      toast.success('Payment marked as cleared')
      fetchPayments() // Refresh data
    } catch (error) {
      console.error('Error marking payment as cleared:', error)
      toast.error('Failed to mark payment as cleared')
    }
  }

  const handleExportCSV = () => {
    const csvHeaders = [
      'Payment ID',
      'DBA',
      'Contract ID',
      'Expected Amount',
      'Actual Amount',
      'Status',
      'PTP',
      'Expected Date',
      'Date Received',
      'Processed By',
      'Notes'
    ]

    const csvData = filteredPayments.map(payment => [
      payment.id,
      payment.dba || '',
      payment.cid || '',
      payment.expectedAmount.toString(),
      payment.actualAmount.toString(),
      payment.status,
      payment.ptp ? 'Yes' : 'No',
      payment.expectedDate ? new Date(payment.expectedDate).toLocaleDateString() : '',
      payment.actualDateReceived ? new Date(payment.actualDateReceived).toLocaleDateString() : '',
      payment.processedBy || '',
      payment.notesForTreasury || ''
    ])

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `treasurystream-payments-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Payment data exported successfully')
  }

  const handleModalClose = () => {
    setShowManualModal(false)
    setShowHistoryModal(false)
    setSelectedPayment(null)
    fetchPayments() // Refresh data after modal actions
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading TreasuryStream...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onExportCSV={handleExportCSV} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Comprehensive wire payment processing and monitoring
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    {filteredPayments.length} payments found
                  </p>
                </div>
              </div>
            </div>
            
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <DataTable
              payments={filteredPayments}
              loading={loading}
              onMarkAsCleared={handleMarkAsCleared}
              onManualPost={handleManualPost}
              onViewHistory={handleViewHistory}
            />
          </div>
        </div>
      </main>

      {selectedPayment && showManualModal && (
        <ManualPostingModal
          payment={selectedPayment}
          onClose={handleModalClose}
          onComplete={handleModalClose}
        />
      )}

      {selectedPayment && showHistoryModal && (
        <PaymentHistoryModal
          payment={selectedPayment}
          onClose={handleModalClose}
          onPaymentUpdate={fetchPayments}
        />
      )}
    </div>
  )
}
