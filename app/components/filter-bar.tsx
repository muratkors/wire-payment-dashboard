
'use client'

import { useState } from 'react'
import { PaymentStatus } from '@prisma/client'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Label } from './ui/label'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

interface FilterState {
  dba: string
  cid: string
  status: PaymentStatus | 'ALL'
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
}

interface FilterBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  searchTerm: string
  onSearchChange: (search: string) => void
}

export function FilterBar({
  filters,
  onFiltersChange,
  searchTerm,
  onSearchChange,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      dba: '',
      cid: '',
      status: 'ALL',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
    })
    onSearchChange('')
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'ALL'
  ) || searchTerm !== ''

  return (
    <Card className="p-4">
      {/* Search Bar and Toggle */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by DBA, Contract ID, or notes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              !
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <Label htmlFor="dba-filter" className="text-sm font-medium text-gray-700">
              DBA Name
            </Label>
            <Input
              id="dba-filter"
              type="text"
              placeholder="Enter DBA name"
              value={filters.dba}
              onChange={(e) => handleFilterChange('dba', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="cid-filter" className="text-sm font-medium text-gray-700">
              Contract ID
            </Label>
            <Input
              id="cid-filter"
              type="text"
              placeholder="Enter Contract ID"
              value={filters.cid}
              onChange={(e) => handleFilterChange('cid', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Status
            </Label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CLEARED">Cleared (Manual)</option>
              <option value="AUTO_CLEARED">Auto Cleared</option>
              <option value="UNCLEARED">Uncleared</option>
              <option value="REVIEW_REQUIRED">Review Required</option>
              <option value="MANUAL_POSTED">Manual Posted</option>
              <option value="REVERTED">Reverted</option>
            </select>
          </div>

          <div>
            <Label htmlFor="amount-min" className="text-sm font-medium text-gray-700">
              Amount Range
            </Label>
            <div className="flex space-x-2">
              <Input
                id="amount-min"
                type="number"
                placeholder="Min"
                value={filters.amountMin}
                onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                className="w-full"
              />
              <Input
                id="amount-max"
                type="number"
                placeholder="Max"
                value={filters.amountMax}
                onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date-from" className="text-sm font-medium text-gray-700">
              Date From
            </Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="date-to" className="text-sm font-medium text-gray-700">
              Date To
            </Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>
      )}
    </Card>
  )
}
