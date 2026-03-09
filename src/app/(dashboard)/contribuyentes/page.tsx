'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Users, Edit, Trash2 } from 'lucide-react'

interface Contribuyente {
  id: string
  rfc: string
  razonSocial: string
  regimenFiscal: string
  codigoPostal: string
  email: string | null
  active: boolean
}

export default function ContribuyentesPage() {
  const [contribuyentes, setContribuyentes] = useState<Contribuyente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('limit', '50')

    fetch(`/api/contribuyentes?${params}`)
      .then((res) => res.json())
      .then((data) => setContribuyentes(data.contribuyentes || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search])

  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de eliminar este contribuyente?')) return
    await fetch(`/api/contribuyentes/${id}`, { method: 'DELETE' })
    setContribuyentes((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contribuyentes</h1>
          <p className="text-gray-500 mt-1">Catálogo de emisores y receptores</p>
        </div>
        <Link href="/contribuyentes/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por RFC o razón social..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-gray-900 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : contribuyentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Users className="h-12 w-12 mb-2 text-gray-300" />
              <p>No se encontraron contribuyentes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFC</TableHead>
                  <TableHead>Razón Social</TableHead>
                  <TableHead>Régimen Fiscal</TableHead>
                  <TableHead>C.P.</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contribuyentes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium">{c.rfc}</TableCell>
                    <TableCell>{c.razonSocial}</TableCell>
                    <TableCell>
                      <Badge variant="info">{c.regimenFiscal}</Badge>
                    </TableCell>
                    <TableCell>{c.codigoPostal}</TableCell>
                    <TableCell className="text-sm text-gray-500">{c.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={c.active ? 'success' : 'default'}>
                        {c.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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
