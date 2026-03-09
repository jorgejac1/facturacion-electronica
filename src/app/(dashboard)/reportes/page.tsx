'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { FileBarChart, Download, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

interface ReporteMensual {
  id: string
  mes: number
  anio: number
  totalTimbrados: number
  totalCancelados: number
  totalErrores: number
  montoTotal: number
  timbresConsumidos: number
  timbresDisponibles: number
  incidentesAlta: number
  incidentesMedia: number
  incidentesBaja: number
  cumplimientoSLA: number
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function ReportesPage() {
  const [reportes, setReportes] = useState<ReporteMensual[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/reportes?limit=12')
      .then((res) => res.json())
      .then((data) => setReportes(data.reportes || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function generateReport() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/reportes?mes=${selectedMonth}&anio=${selectedYear}&generate=true`)
      const data = await res.json()
      if (data.reporte) {
        setReportes((prev) => {
          const exists = prev.find((r) => r.mes === data.reporte.mes && r.anio === data.reporte.anio)
          if (exists) {
            return prev.map((r) => (r.id === exists.id ? data.reporte : r))
          }
          return [data.reporte, ...prev]
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const currentReport = reportes.find(
    (r) => r.mes === selectedMonth && r.anio === selectedYear
  )

  // Accumulated totals
  const acumulado = reportes
    .filter((r) => r.anio === selectedYear)
    .reduce(
      (acc, r) => ({
        timbrados: acc.timbrados + r.totalTimbrados,
        cancelados: acc.cancelados + r.totalCancelados,
        monto: acc.monto + r.montoTotal,
        timbres: acc.timbres + r.timbresConsumidos,
      }),
      { timbrados: 0, cancelados: 0, monto: 0, timbres: 0 }
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 mt-1">Reportes mensuales y acumulados de timbrado</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          >
            {MESES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={generateReport} loading={generating}>
            <FileBarChart className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </div>

      {/* Acumulado anual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title={`Timbrados ${selectedYear}`}
          value={acumulado.timbrados.toLocaleString()}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />
        <StatCard
          title={`Cancelados ${selectedYear}`}
          value={acumulado.cancelados.toLocaleString()}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
        />
        <StatCard
          title={`Monto Total ${selectedYear}`}
          value={formatCurrency(acumulado.monto)}
          icon={<FileText className="h-6 w-6" />}
          color="blue"
        />
        <StatCard
          title="Timbres Consumidos"
          value={`${acumulado.timbres.toLocaleString()} / 4,000,000`}
          icon={<FileBarChart className="h-6 w-6" />}
          color="yellow"
        />
      </div>

      {/* Selected month detail */}
      {currentReport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Reporte {MESES[currentReport.mes - 1]} {currentReport.anio}
              </CardTitle>
              <Badge variant={currentReport.cumplimientoSLA >= 95 ? 'success' : currentReport.cumplimientoSLA >= 80 ? 'warning' : 'error'}>
                SLA: {currentReport.cumplimientoSLA}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Timbrados</p>
                <p className="text-2xl font-bold text-green-600">{currentReport.totalTimbrados.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cancelados</p>
                <p className="text-2xl font-bold text-red-600">{currentReport.totalCancelados.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Errores</p>
                <p className="text-2xl font-bold text-yellow-600">{currentReport.totalErrores.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(currentReport.montoTotal)}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-3">Incidencias del Mes</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-500">Alta</p>
                  <p className="text-xl font-bold text-red-600">{currentReport.incidentesAlta}</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-500">Media</p>
                  <p className="text-xl font-bold text-yellow-600">{currentReport.incidentesMedia}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">Baja</p>
                  <p className="text-xl font-bold text-blue-600">{currentReport.incidentesBaja}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical reports */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Reportes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : reportes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay reportes generados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Timbrados</TableHead>
                  <TableHead className="text-right">Cancelados</TableHead>
                  <TableHead className="text-right">Errores</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Timbres</TableHead>
                  <TableHead className="text-center">SLA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportes.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {MESES[r.mes - 1]} {r.anio}
                    </TableCell>
                    <TableCell className="text-right">{r.totalTimbrados.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.totalCancelados.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{r.totalErrores.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.montoTotal)}</TableCell>
                    <TableCell className="text-right">{r.timbresConsumidos.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={r.cumplimientoSLA >= 95 ? 'success' : r.cumplimientoSLA >= 80 ? 'warning' : 'error'}>
                        {r.cumplimientoSLA}%
                      </Badge>
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
