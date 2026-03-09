'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'

interface DashboardData {
  totalCfdis: number
  timbrados: number
  cancelados: number
  pendientes: number
  errores: number
  montoTotalMes: number
  timbresConsumidosMes: number
  timbresDisponibles: number
  cumplimientoSLA: number
  incidentesAbiertos: number
  actividadReciente: Array<{
    id: string
    tipo: string
    descripcion: string
    fecha: string
    status: string
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          console.error('Dashboard error:', json.error)
          return
        }
        setData(json)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-gray-500">Error al cargar el dashboard</p>
  }

  const timbresUsados = data.timbresConsumidosMes
  const timbresTotal = 4_000_000
  const porcentajeUso = ((timbresUsados / timbresTotal) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen de operaciones de timbrado CFDI</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CFDIs Timbrados"
          value={data.timbrados.toLocaleString()}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title="Pendientes"
          value={data.pendientes.toLocaleString()}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
        />
        <StatCard
          title="Cancelados"
          value={data.cancelados.toLocaleString()}
          icon={<XCircle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title="Monto del Mes"
          value={formatCurrency(data.montoTotalMes)}
          icon={<TrendingUp className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timbres consumption */}
        <Card>
          <CardHeader>
            <CardTitle>Consumo de Timbres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Consumidos este mes</span>
                <span className="font-semibold">{timbresUsados.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(parseFloat(porcentajeUso), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Póliza anual: {timbresTotal.toLocaleString()}</span>
                <span className="text-indigo-600 font-medium">{porcentajeUso}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Cumplimiento SLA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={data.cumplimientoSLA >= 95 ? '#22c55e' : data.cumplimientoSLA >= 80 ? '#eab308' : '#ef4444'}
                    strokeWidth="10"
                    strokeDasharray={`${(data.cumplimientoSLA / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{data.cumplimientoSLA}%</span>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500">
              {data.incidentesAbiertos} incidencias abiertas
            </div>
          </CardContent>
        </Card>

        {/* Errores */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Servicio de timbrado</span>
                </div>
                <Badge variant="success">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Validación SAT</span>
                </div>
                <Badge variant="success">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {data.errores > 0 ? (
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  )}
                  <span className="text-sm text-gray-600">Errores hoy</span>
                </div>
                <Badge variant={data.errores > 0 ? 'warning' : 'success'}>
                  {data.errores}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {data.actividadReciente.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No hay actividad reciente</p>
          ) : (
            <div className="space-y-3">
              {data.actividadReciente.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.status === 'TIMBRADO' ? 'bg-green-100 text-green-600' :
                      item.status === 'CANCELADO' ? 'bg-red-100 text-red-600' :
                      item.status === 'ERROR' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.descripcion}</p>
                      <p className="text-xs text-gray-500">{item.tipo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      item.status === 'TIMBRADO' ? 'success' :
                      item.status === 'CANCELADO' ? 'error' :
                      item.status === 'ERROR' ? 'warning' : 'default'
                    }>
                      {item.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.fecha).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
