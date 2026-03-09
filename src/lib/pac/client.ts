import type {
  PacProvider,
  TimbradoRequest,
  TimbradoResult,
  CancelacionRequest,
  CancelacionResult,
  EstatusRequest,
  EstatusResult,
} from './types'
import { MockPacProvider } from './mock-provider'
import { FacturaDigitalProvider } from './factura-digital-provider'

// Re-exportar tipos para compatibilidad
export type { TimbradoRequest, TimbradoResult, CancelacionRequest, CancelacionResult, EstatusRequest, EstatusResult }

// ─── Selección de proveedor PAC ─────────────────────────────
//
// Controlado por la variable de entorno PAC_PROVIDER:
//   - "mock"             → Mock local (default, para desarrollo)
//   - "factura-digital"  → Factura Digital / FacturoPorTi API REST
//
// Para usar Factura Digital, configura en .env.local:
//   PAC_PROVIDER=factura-digital
//   PAC_API_KEY=tu-api-key
//   PAC_API_SECRET=tu-api-secret
//   PAC_SANDBOX=true
//   PAC_SANDBOX_URL=https://testapi.facturoporti.com.mx  (opcional)
//   PAC_API_URL=https://api.facturoporti.com.mx          (opcional, producción)
//

function createProvider(): PacProvider {
  const provider = process.env.PAC_PROVIDER || 'mock'

  switch (provider) {
    case 'factura-digital':
      return new FacturaDigitalProvider()
    case 'mock':
    default:
      return new MockPacProvider()
  }
}

// Singleton del proveedor PAC
let pacProvider: PacProvider | null = null

function getProvider(): PacProvider {
  if (!pacProvider) {
    pacProvider = createProvider()
    console.log(`[PAC] Proveedor activo: ${pacProvider.nombre}`)
  }
  return pacProvider
}

// ─── API pública (misma firma que antes) ─────────────────────

export async function timbrar(request: TimbradoRequest): Promise<TimbradoResult> {
  return getProvider().timbrar(request)
}

export async function cancelar(request: CancelacionRequest): Promise<CancelacionResult> {
  return getProvider().cancelar(request)
}

export async function validarEstatus(request: EstatusRequest): Promise<EstatusResult> {
  return getProvider().validarEstatus(request)
}

// Utilidad para saber qué proveedor está activo
export function getProviderInfo(): { nombre: string; tipo: string } {
  const p = getProvider()
  return { nombre: p.nombre, tipo: process.env.PAC_PROVIDER || 'mock' }
}
