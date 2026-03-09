'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default function NuevoContribuyentePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [rfc, setRfc] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [regimenFiscal, setRegimenFiscal] = useState('R601')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/contribuyentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfc: rfc.toUpperCase().trim(),
          razonSocial,
          regimenFiscal,
          codigoPostal,
          email: email || undefined,
          telefono: telefono || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear contribuyente')
      }

      router.push('/contribuyentes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contribuyentes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Contribuyente</h1>
          <p className="text-gray-500 mt-1">Registrar emisor o receptor</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Datos Fiscales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="RFC"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                placeholder="XAXX010101000"
                maxLength={13}
                required
              />
              <Input
                label="Razón Social"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                required
              />
              <Select
                label="Régimen Fiscal"
                value={regimenFiscal}
                onChange={(e) => setRegimenFiscal(e.target.value)}
                required
              >
                <option value="R601">601 - General de Ley PM</option>
                <option value="R603">603 - PM Fines no Lucrativos</option>
                <option value="R605">605 - Sueldos y Salarios</option>
                <option value="R606">606 - Arrendamiento</option>
                <option value="R608">608 - Demás ingresos</option>
                <option value="R612">612 - PF Actividades Empresariales</option>
                <option value="R616">616 - Incorporación Fiscal</option>
                <option value="R625">625 - RESICO</option>
                <option value="R626">626 - RESICO PM</option>
              </Select>
              <Input
                label="Código Postal"
                value={codigoPostal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                placeholder="01000"
                maxLength={5}
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
              <Input
                label="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="55 1234 5678"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Link href="/contribuyentes">
              <Button type="button" variant="secondary">Cancelar</Button>
            </Link>
            <Button type="submit" loading={loading}>
              Guardar
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
