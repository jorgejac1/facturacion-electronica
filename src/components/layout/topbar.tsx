'use client'

import { Menu } from 'lucide-react'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1" />
        <div className="text-sm text-gray-500">
          Sistema de Timbrado CFDI
        </div>
      </div>
    </header>
  )
}
