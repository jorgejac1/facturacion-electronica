'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface Incident {
  id: string
  titulo: string
  priority: string
  status: string
  fechaReporte: string
  tiempoAtencionMinutos: number | null
  tiempoResolucionMinutos: number | null
  cumpleSLA: boolean | null
  createdBy: { name: string }
}

const priorityVariant = (p: string) => {
  switch (p) {
    case 'ALTA': return 'error' as const
    case 'MEDIA': return 'warning' as const
    default: return 'info' as const
  }
}

const statusVariant = (s: string) => {
  switch (s) {
    case 'RESUELTO':
    case 'CERRADO': return 'success' as const
    case 'EN_ATENCION': return 'warning' as const
    default: return 'default' as const
  }
}

// SLA limits in minutes
const SLA_LIMITS = {
  ALTA: { atencion: 30, resolucion: 60 },
  MEDIA: { atencion: 120, resolucion: 240 },
  BAJA: { atencion: 300, resolucion: 600 },
}

export default function IncidenciasPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)

    fetch(`/api/incidencias?${params}`)
      .then((res) => res.json())
      .then((data) => setIncidents(data.incidents || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidencias</h1>
          <p className="text-gray-500 mt-1">Seguimiento de incidencias y cumplimiento SLA</p>
        </div>
        <Link href="/incidencias/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Incidencia
          </Button>
        </Link>
      </div>

      {/* SLA Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Alta Prioridad</p>
              <p className="text-xl font-bold text-gray-900">
                SLA: 0.5h atención / 1h resolución
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Media Prioridad</p>
              <p className="text-xl font-bold text-gray-900">
                SLA: 2h atención / 4h resolución
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Baja Prioridad</p>
              <p className="text-xl font-bold text-gray-900">
                SLA: 5h atención / 10h resolución
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'ABIERTO', 'EN_ATENCION', 'RESUELTO', 'CERRADO'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'Todas'}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <AlertTriangle className="h-12 w-12 mb-2 text-gray-300" />
              <p>No se encontraron incidencias</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Reportado</TableHead>
                  <TableHead>T. Atención</TableHead>
                  <TableHead>T. Resolución</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Reportado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell>
                      <Link href={`/incidencias/${inc.id}`} className="text-indigo-600 hover:underline font-medium">
                        {inc.titulo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant(inc.priority)}>{inc.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(inc.status)}>
                        {inc.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(inc.fechaReporte).toLocaleString('es-MX')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inc.tiempoAtencionMinutos != null ? `${inc.tiempoAtencionMinutos} min` : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inc.tiempoResolucionMinutos != null ? `${inc.tiempoResolucionMinutos} min` : '-'}
                    </TableCell>
                    <TableCell>
                      {inc.cumpleSLA === null ? (
                        <Badge variant="default">Pendiente</Badge>
                      ) : inc.cumpleSLA ? (
                        <Badge variant="success">Cumple</Badge>
                      ) : (
                        <Badge variant="error">No cumple</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {inc.createdBy.name}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
