
'use client'

import { Download, User, Waves } from 'lucide-react'
import { Button } from './ui/button'

interface HeaderProps {
  onExportCSV: () => void
}

export function Header({ onExportCSV }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Waves className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                TreasuryStream
              </h1>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                PRO
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={onExportCSV}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Treasury User</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
