'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, Shield, Server, Key, CheckCircle } from 'lucide-react'

export default function ConfiguracionPage() {
  const [pacConfig, setPacConfig] = useState({
    nombre: 'Factura Digital (FacturoPorTi)',
    apiUrl: 'https://api.facturoporti.com.mx',
    apiUrlSandbox: 'https://testapi.facturoporti.com.mx',
    apiKey: '••••••••••••',
    apiSecret: '••••••••••••',
    sandbox: true,
  })

  const [providerInfo, setProviderInfo] = useState({ nombre: '', tipo: '' })

  useEffect(() => {
    fetch('/api/pac/info').then(r => r.json()).then(setProviderInfo).catch(() => {})
  }, [])

  const [saving, setSaving] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Configuración del PAC y certificados</p>
      </div>

      {/* PAC Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Server className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle>Proveedor Autorizado de Certificación (PAC)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {providerInfo.nombre && (
                <Badge variant="info">{providerInfo.nombre}</Badge>
              )}
              <Badge variant={pacConfig.sandbox ? 'warning' : 'success'}>
                {pacConfig.sandbox ? 'Sandbox' : 'Producción'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del PAC"
              value={pacConfig.nombre}
              onChange={(e) => setPacConfig({ ...pacConfig, nombre: e.target.value })}
            />
            <Input
              label="URL API Producción"
              value={pacConfig.apiUrl}
              onChange={(e) => setPacConfig({ ...pacConfig, apiUrl: e.target.value })}
            />
            <Input
              label="URL API Sandbox"
              value={pacConfig.apiUrlSandbox}
              onChange={(e) => setPacConfig({ ...pacConfig, apiUrlSandbox: e.target.value })}
            />
            <Input
              label="API Key"
              value={pacConfig.apiKey}
              onChange={(e) => setPacConfig({ ...pacConfig, apiKey: e.target.value })}
              type="password"
            />
            <Input
              label="API Secret"
              value={pacConfig.apiSecret}
              onChange={(e) => setPacConfig({ ...pacConfig, apiSecret: e.target.value })}
              type="password"
            />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pacConfig.sandbox}
                  onChange={(e) => setPacConfig({ ...pacConfig, sandbox: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Modo Sandbox (Pruebas)</span>
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button loading={saving}>
            Guardar Configuración
          </Button>
        </CardFooter>
      </Card>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle>Certificados de Sello Digital (CSD)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">
                Cargue su certificado (.cer) y llave privada (.key) del CSD
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" size="sm">
                  Cargar Certificado (.cer)
                </Button>
                <Button variant="secondary" size="sm">
                  Cargar Llave Privada (.key)
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <Settings className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Modo Sandbox Activo</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    En modo sandbox se utilizan certificados de prueba del SAT.
                    Cambie a modo producción para utilizar certificados reales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card>
        <CardHeader>
          <CardTitle>Cumplimiento y Validaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Validación LRFC (Lista de RFC)</span>
              <Badge variant="success">Activa</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Validación LCO (Lista de Contribuyentes Obligados)</span>
              <Badge variant="success">Activa</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Detección EFOS (Empresas Fantasma)</span>
              <Badge variant="success">Activa</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Detección EDOS (Empresas que Deducen Operaciones Simuladas)</span>
              <Badge variant="success">Activa</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Anexo 20 del SAT</span>
              <Badge variant="info">v4.0 - Actualizado</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
