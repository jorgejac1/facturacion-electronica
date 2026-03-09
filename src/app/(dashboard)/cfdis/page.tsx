'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, FileText, Eye } from 'lucide-react'

interface CfdiListItem {
  id: string
  serie: string | null
  folio: string | null
  fecha: string
  tipo: string
  status: string
  total: number
  uuid: string | null
  emisor: { rfc: string; razonSocial: string }
  receptor: { rfc: string; razonSocial: string }
}

const statusVariant = (s: string) => {
  switch (s) {
    case 'TIMBRADO': return 'success' as const
    case 'CANCELADO': return 'error' as const
    case 'ERROR': return 'warning' as const
    default: return 'default' as const
  }
}

export default function CfdisPage() {
  const [cfdis, setCfdis] = useState<CfdiListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (tipoFilter) params.set('tipo', tipoFilter)
    params.set('page', page.toString())
    params.set('limit', '20')

    fetch(`/api/cfdis?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setCfdis(data.cfdis || [])
        setTotalPages(data.totalPages || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, statusFilter, tipoFilter, page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CFDIs</h1>
          <p className="text-gray-500 mt-1">Gestión de Comprobantes Fiscales Digitales</p>
        </div>
        <Link href="/cfdis/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo CFDI
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por RFC, razón social, UUID..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-gray-900 bg-white"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="TIMBRADO">Timbrado</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="ERROR">Error</option>
            </select>
            <select
              value={tipoFilter}
              onChange={(e) => { setTipoFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Todos los tipos</option>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
              <option value="TRASLADO">Traslado</option>
              <option value="NOMINA">Nómina</option>
              <option value="PAGO">Pago</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : cfdis.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <FileText className="h-12 w-12 mb-2 text-gray-300" />
              <p>No se encontraron CFDIs</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serie/Folio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Emisor</TableHead>
                  <TableHead>Receptor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cfdis.map((cfdi) => (
                  <TableRow key={cfdi.id}>
                    <TableCell className="font-medium">
                      {cfdi.serie || '-'}{cfdi.folio ? `-${cfdi.folio}` : ''}
                    </TableCell>
                    <TableCell>
                      {new Date(cfdi.fecha).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{cfdi.emisor.rfc}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{cfdi.emisor.razonSocial}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{cfdi.receptor.rfc}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{cfdi.receptor.razonSocial}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{cfdi.tipo}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cfdi.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(cfdi.status)}>{cfdi.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-400 font-mono">
                        {cfdi.uuid ? cfdi.uuid.substring(0, 8) + '...' : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/cfdis/${cfdi.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
