import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  icon: ReactNode
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'indigo'
}

const colors = {
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  indigo: 'bg-indigo-100 text-indigo-600',
}

export function StatCard({ title, value, icon, color = 'indigo' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={cn('p-3 rounded-lg', colors[color])}>
          {icon}
        </div>
      </div>
    </div>
  )
}
