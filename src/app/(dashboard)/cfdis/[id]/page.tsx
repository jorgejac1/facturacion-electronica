'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Stamp, XCircle, Download, FileText } from 'lucide-react'

interface CfdiDetail {
  id: string
  serie: string | null
  folio: string | null
  fecha: string
  tipo: string
  status: string
  usoCfdi: string
  metodoPago: string
  formaPago: string
  moneda: string
  tipoCambio: number
  lugarExpedicion: string
  subtotal: number
  descuento: number
  totalImpuestos: number
  total: number
  uuid: string | null
  fechaTimbrado: string | null
  noCertificadoSAT: string | null
  fechaCancelacion: string | null
  motivoCancelacion: string | null
  pdfUrl: string | null
  emisor: { rfc: string; razonSocial: string; regimenFiscal: string }
  receptor: { rfc: string; razonSocial: string }
  conceptos: Array<{
    id: string
    claveProdServ: string
    cantidad: number
    claveUnidad: string
    unidad: string | null
    descripcion: string
    valorUnitario: number
    importe: number
    tasaIVA: number | null
    importeIVA: number | null
  }>
}

const statusVariant = (s: string) => {
  switch (s) {
    case 'TIMBRADO': return 'success' as const
    case 'CANCELADO': return 'error' as const
    case 'ERROR': return 'warning' as const
    default: return 'default' as const
  }
}

export default function CfdiDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cfdi, setCfdi] = useState<CfdiDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [motivoCancelacion, setMotivoCancelacion] = useState('02')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/cfdis/${params.id}`)
      .then((res) => res.json())
      .then(setCfdi)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleTimbrar() {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/cfdis/${params.id}/timbrar`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al timbrar')
      }
      const updated = await res.json()
      setCfdi((prev) => prev ? { ...prev, ...updated } : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelar() {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/cfdis/${params.id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoCancelacion }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cancelar')
      }
      const updated = await res.json()
      setCfdi((prev) => prev ? { ...prev, ...updated } : prev)
      setShowCancelModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!cfdi) {
    return <p className="text-gray-500">CFDI no encontrado</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cfdis">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                CFDI {cfdi.serie}{cfdi.folio ? `-${cfdi.folio}` : ''}
              </h1>
              <Badge variant={statusVariant(cfdi.status)} className="text-sm">
                {cfdi.status}
              </Badge>
            </div>
            {cfdi.uuid && (
              <p className="text-sm text-gray-500 font-mono mt-1">UUID: {cfdi.uuid}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {cfdi.status === 'PENDIENTE' && (
            <Button onClick={handleTimbrar} loading={actionLoading}>
              <Stamp className="h-4 w-4 mr-2" />
              Timbrar
            </Button>
          )}
          {cfdi.status === 'TIMBRADO' && (
            <>
              {cfdi.pdfUrl && (
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
              <Button variant="danger" onClick={() => setShowCancelModal(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emisor */}
        <Card>
          <CardHeader>
            <CardTitle>Emisor</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">RFC</dt>
                <dd className="text-sm font-medium text-gray-900">{cfdi.emisor.rfc}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Razón Social</dt>
                <dd className="text-sm font-medium text-gray-900">{cfdi.emisor.razonSocial}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Régimen Fiscal</dt>
                <dd className="text-sm font-medium text-gray-900">{cfdi.emisor.regimenFiscal}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Lugar Expedición</dt>
                <dd className="text-sm font-medium text-gray-900">{cfdi.lugarExpedicion}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Receptor */}
        <Card>
          <CardHeader>
            <CardTitle>Receptor</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">RFC</dt>
                <dd className="text-sm font-medium text-gray-900">{cfdi.receptor.rfc}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Razón Social</dt>
                <dd className="text-sm font-medium text-gray-900">{cfdi.receptor.razonSocial}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Uso CFDI</dt>
                <dd className="text-sm font-medium text-gray-900">{cfdi.usoCfdi}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Datos fiscales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del Comprobante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-medium text-gray-900">{cfdi.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Método de Pago</p>
              <p className="font-medium text-gray-900">{cfdi.metodoPago}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Forma de Pago</p>
              <p className="font-medium text-gray-900">{cfdi.formaPago}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Moneda</p>
              <p className="font-medium text-gray-900">{cfdi.moneda}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium text-gray-900">{new Date(cfdi.fecha).toLocaleString('es-MX')}</p>
            </div>
            {cfdi.fechaTimbrado && (
              <div>
                <p className="text-sm text-gray-500">Fecha Timbrado</p>
                <p className="font-medium text-gray-900">{new Date(cfdi.fechaTimbrado).toLocaleString('es-MX')}</p>
              </div>
            )}
            {cfdi.noCertificadoSAT && (
              <div>
                <p className="text-sm text-gray-500">No. Certificado SAT</p>
                <p className="font-medium font-mono text-xs text-gray-900">{cfdi.noCertificadoSAT}</p>
              </div>
            )}
            {cfdi.fechaCancelacion && (
              <div>
                <p className="text-sm text-gray-500">Fecha Cancelación</p>
                <p className="font-medium text-red-600">{new Date(cfdi.fechaCancelacion).toLocaleString('es-MX')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conceptos */}
      <Card>
        <CardHeader>
          <CardTitle>Conceptos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">P. Unitario</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Importe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cfdi.conceptos.map((concepto) => (
                <TableRow key={concepto.id}>
                  <TableCell className="font-mono text-xs">{concepto.claveProdServ}</TableCell>
                  <TableCell>{concepto.descripcion}</TableCell>
                  <TableCell className="text-right">{concepto.cantidad}</TableCell>
                  <TableCell>{concepto.unidad || concepto.claveUnidad}</TableCell>
                  <TableCell className="text-right">{formatCurrency(concepto.valorUnitario)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(concepto.importeIVA || 0)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(concepto.importe)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totales */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(cfdi.subtotal)}</span>
              </div>
              {cfdi.descuento > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Descuento</span>
                  <span className="text-red-600">-{formatCurrency(cfdi.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IVA</span>
                <span className="text-gray-900">{formatCurrency(cfdi.totalImpuestos)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(cfdi.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancelar CFDI"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Esta acción cancelará el CFDI ante el SAT. Seleccione el motivo de cancelación.
          </p>
          <select
            value={motivoCancelacion}
            onChange={(e) => setMotivoCancelacion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          >
            <option value="01">01 - Comprobante emitido con errores con relación</option>
            <option value="02">02 - Comprobante emitido con errores sin relación</option>
            <option value="03">03 - No se llevó a cabo la operación</option>
            <option value="04">04 - Operación nominativa relacionada en factura global</option>
          </select>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Cerrar
            </Button>
            <Button variant="danger" onClick={handleCancelar} loading={actionLoading}>
              Confirmar Cancelación
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
