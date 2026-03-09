'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Contribuyente {
  id: string
  rfc: string
  razonSocial: string
  codigoPostal: string
}

interface ConceptoForm {
  claveProdServ: string
  cantidad: number
  claveUnidad: string
  unidad: string
  descripcion: string
  valorUnitario: number
  tasaIVA: number
}

export default function NuevoCfdiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contribuyentes, setContribuyentes] = useState<Contribuyente[]>([])
  const [error, setError] = useState('')

  const [emisorId, setEmisorId] = useState('')
  const [receptorId, setReceptorId] = useState('')
  const [serie, setSerie] = useState('A')
  const [tipo, setTipo] = useState('INGRESO')
  const [usoCfdi, setUsoCfdi] = useState('G03')
  const [metodoPago, setMetodoPago] = useState('PUE')
  const [formaPago, setFormaPago] = useState('TRANSFERENCIA')
  const [moneda, setMoneda] = useState('MXN')

  const [conceptos, setConceptos] = useState<ConceptoForm[]>([
    {
      claveProdServ: '84111506',
      cantidad: 1,
      claveUnidad: 'E48',
      unidad: 'Unidad de servicio',
      descripcion: '',
      valorUnitario: 0,
      tasaIVA: 0.16,
    },
  ])

  useEffect(() => {
    fetch('/api/contribuyentes?limit=100')
      .then((res) => res.json())
      .then((data) => setContribuyentes(data.contribuyentes || []))
      .catch(console.error)
  }, [])

  function addConcepto() {
    setConceptos([
      ...conceptos,
      {
        claveProdServ: '84111506',
        cantidad: 1,
        claveUnidad: 'E48',
        unidad: 'Unidad de servicio',
        descripcion: '',
        valorUnitario: 0,
        tasaIVA: 0.16,
      },
    ])
  }

  function removeConcepto(index: number) {
    setConceptos(conceptos.filter((_, i) => i !== index))
  }

  function updateConcepto(index: number, field: keyof ConceptoForm, value: string | number) {
    const updated = [...conceptos]
    updated[index] = { ...updated[index], [field]: value }
    setConceptos(updated)
  }

  const subtotal = conceptos.reduce((acc, c) => acc + c.cantidad * c.valorUnitario, 0)
  const totalIVA = conceptos.reduce((acc, c) => acc + c.cantidad * c.valorUnitario * c.tasaIVA, 0)
  const total = subtotal + totalIVA

  const emisorSeleccionado = contribuyentes.find((c) => c.id === emisorId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = {
      emisorId,
      receptorId,
      serie,
      tipo,
      usoCfdi,
      metodoPago,
      formaPago,
      moneda,
      lugarExpedicion: emisorSeleccionado?.codigoPostal || '',
      subtotal,
      totalImpuestos: totalIVA,
      total,
      conceptos: conceptos.map((c) => ({
        claveProdServ: c.claveProdServ,
        cantidad: c.cantidad,
        claveUnidad: c.claveUnidad,
        unidad: c.unidad,
        descripcion: c.descripcion,
        valorUnitario: c.valorUnitario,
        importe: c.cantidad * c.valorUnitario,
        tasaIVA: c.tasaIVA,
        importeIVA: c.cantidad * c.valorUnitario * c.tasaIVA,
      })),
    }

    try {
      const res = await fetch('/api/cfdis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear CFDI')
      }

      const cfdi = await res.json()
      router.push(`/cfdis/${cfdi.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cfdis">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo CFDI</h1>
          <p className="text-gray-500 mt-1">Crear un nuevo comprobante fiscal</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos generales */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Emisor"
                value={emisorId}
                onChange={(e) => setEmisorId(e.target.value)}
                required
              >
                <option value="">Seleccionar emisor</option>
                {contribuyentes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.rfc} - {c.razonSocial}
                  </option>
                ))}
              </Select>

              <Select
                label="Receptor"
                value={receptorId}
                onChange={(e) => setReceptorId(e.target.value)}
                required
              >
                <option value="">Seleccionar receptor</option>
                {contribuyentes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.rfc} - {c.razonSocial}
                  </option>
                ))}
              </Select>

              <Input
                label="Serie"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
              />

              <Select
                label="Tipo de Comprobante"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
                <option value="TRASLADO">Traslado</option>
                <option value="PAGO">Pago</option>
              </Select>

              <Select
                label="Uso CFDI"
                value={usoCfdi}
                onChange={(e) => setUsoCfdi(e.target.value)}
              >
                <option value="G01">G01 - Adquisición de mercancías</option>
                <option value="G03">G03 - Gastos en general</option>
                <option value="I01">I01 - Construcciones</option>
                <option value="I04">I04 - Equipo de cómputo</option>
                <option value="P01">P01 - Por definir</option>
                <option value="S01">S01 - Sin efectos fiscales</option>
                <option value="CP01">CP01 - Pagos</option>
              </Select>

              <Select
                label="Método de Pago"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="PUE">PUE - Pago en una sola exhibición</option>
                <option value="PPD">PPD - Pago en parcialidades</option>
              </Select>

              <Select
                label="Forma de Pago"
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
              >
                <option value="EFECTIVO">01 - Efectivo</option>
                <option value="CHEQUE_NOMINATIVO">02 - Cheque nominativo</option>
                <option value="TRANSFERENCIA">03 - Transferencia electrónica</option>
                <option value="TARJETA_CREDITO">04 - Tarjeta de crédito</option>
                <option value="TARJETA_DEBITO">28 - Tarjeta de débito</option>
                <option value="POR_DEFINIR">99 - Por definir</option>
              </Select>

              <Select
                label="Moneda"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
              >
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conceptos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conceptos</CardTitle>
              <Button type="button" variant="secondary" size="sm" onClick={addConcepto}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conceptos.map((concepto, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Concepto {index + 1}</span>
                    {conceptos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeConcepto(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Input
                      label="Clave Prod/Serv"
                      value={concepto.claveProdServ}
                      onChange={(e) => updateConcepto(index, 'claveProdServ', e.target.value)}
                      required
                    />
                    <Input
                      label="Descripción"
                      value={concepto.descripcion}
                      onChange={(e) => updateConcepto(index, 'descripcion', e.target.value)}
                      required
                    />
                    <Input
                      label="Cantidad"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={concepto.cantidad}
                      onChange={(e) => updateConcepto(index, 'cantidad', parseFloat(e.target.value) || 0)}
                      required
                    />
                    <Input
                      label="Valor Unitario"
                      type="number"
                      min="0"
                      step="0.01"
                      value={concepto.valorUnitario}
                      onChange={(e) => updateConcepto(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                      required
                    />
                    <Input
                      label="Clave Unidad"
                      value={concepto.claveUnidad}
                      onChange={(e) => updateConcepto(index, 'claveUnidad', e.target.value)}
                    />
                    <Input
                      label="Unidad"
                      value={concepto.unidad}
                      onChange={(e) => updateConcepto(index, 'unidad', e.target.value)}
                    />
                    <Input
                      label="Tasa IVA"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={concepto.tasaIVA}
                      onChange={(e) => updateConcepto(index, 'tasaIVA', parseFloat(e.target.value) || 0)}
                    />
                    <div className="flex items-end">
                      <div className="text-sm">
                        <p className="text-gray-500">Importe</p>
                        <p className="text-lg font-semibold">
                          ${(concepto.cantidad * concepto.valorUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA</span>
                  <span className="font-medium">${totalIVA.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Link href="/cfdis">
              <Button type="button" variant="secondary">Cancelar</Button>
            </Link>
            <Button type="submit" loading={loading}>
              Crear CFDI
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
