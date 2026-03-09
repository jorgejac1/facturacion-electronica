'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default function NuevaIncidenciaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [priority, setPriority] = useState('MEDIA')
  const [categoria, setCategoria] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion, priority, categoria }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear incidencia')
      }

      router.push('/incidencias')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/incidencias">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Incidencia</h1>
          <p className="text-gray-500 mt-1">Reportar una incidencia del servicio</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Incidencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Descripción breve del problema"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition min-h-[120px] text-gray-900 bg-white"
                  placeholder="Describa el problema en detalle..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Prioridad"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  required
                >
                  <option value="ALTA">Alta - Servicio crítico (SLA: 0.5h / 1h)</option>
                  <option value="MEDIA">Media - Afecta a muchos usuarios (SLA: 2h / 4h)</option>
                  <option value="BAJA">Baja - Usuario único (SLA: 5h / 10h)</option>
                </Select>

                <Select
                  label="Categoría"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="">Sin categoría</option>
                  <option value="TIMBRADO">Timbrado</option>
                  <option value="CANCELACION">Cancelación</option>
                  <option value="VALIDACION">Validación SAT</option>
                  <option value="CONECTIVIDAD">Conectividad PAC</option>
                  <option value="CERTIFICADOS">Certificados</option>
                  <option value="OTRO">Otro</option>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Link href="/incidencias">
              <Button type="button" variant="secondary">Cancelar</Button>
            </Link>
            <Button type="submit" loading={loading}>
              Reportar Incidencia
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
