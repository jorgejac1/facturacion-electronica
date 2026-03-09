import type {
  PacProvider,
  TimbradoRequest,
  TimbradoResult,
  CancelacionRequest,
  CancelacionResult,
  EstatusRequest,
  EstatusResult,
} from './types'

// Factura Digital (FacturoPorTi) — API REST v5
// Docs: https://docs.facturadigital.com.mx/
// API Reference: https://developers.facturoporti.com.mx/reference/api-facturacion-electronica
//
// Endpoints:
//   Timbrar JSON:   POST /servicios/timbrar/json
//   Cancelar CSD:   POST /servicios/cancelar/csd
//   Validar estatus: POST /validar/estatuscfdi
//
// Auth: Bearer token via GET /token

export class FacturaDigitalProvider implements PacProvider {
  nombre = 'Factura Digital'

  private baseUrl: string
  private apiKey: string
  private apiSecret: string
  private token: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    const sandbox = process.env.PAC_SANDBOX !== 'false'
    this.baseUrl = sandbox
      ? (process.env.PAC_SANDBOX_URL || 'https://testapi.facturoporti.com.mx')
      : (process.env.PAC_API_URL || 'https://api.facturoporti.com.mx')
    this.apiKey = process.env.PAC_API_KEY || ''
    this.apiSecret = process.env.PAC_API_SECRET || ''

    if (!this.apiKey || !this.apiSecret) {
      console.warn('[FacturaDigital] PAC_API_KEY y PAC_API_SECRET no configurados. Las llamadas al PAC fallarán.')
    }
  }

  // Obtener token de autenticación
  private async getToken(): Promise<string> {
    // Reusar token si no ha expirado (con 60s de margen)
    if (this.token && Date.now() < this.tokenExpiry - 60000) {
      return this.token
    }

    const res = await fetch(`${this.baseUrl}/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
        'X-API-SECRET': this.apiSecret,
      },
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`[FacturaDigital] Error al obtener token: ${res.status} - ${error}`)
    }

    const data = await res.json()
    this.token = data.token || data.access_token
    // Token válido por 1 hora por default
    this.tokenExpiry = Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600000)

    return this.token!
  }

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    const token = await this.getToken()

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    return res
  }

  // Mapear datos internos al formato que espera Factura Digital
  private mapToFacturaDigitalFormat(req: TimbradoRequest) {
    return {
      Encabezado: {
        Serie: req.comprobante.serie || '',
        Folio: req.comprobante.folio || '',
        Fecha: req.comprobante.fecha,
        TipoDeComprobante: req.comprobante.tipo.charAt(0), // I, E, T, N, P
        MetodoPago: req.comprobante.metodoPago,
        FormaPago: this.mapFormaPago(req.comprobante.formaPago),
        Moneda: req.comprobante.moneda,
        TipoCambio: req.comprobante.tipoCambio,
        LugarExpedicion: req.comprobante.lugarExpedicion,
        SubTotal: req.comprobante.subtotal,
        Descuento: req.comprobante.descuento,
        Total: req.comprobante.total,
      },
      Emisor: {
        Rfc: req.emisor.rfc,
        Nombre: req.emisor.razonSocial,
        RegimenFiscal: req.emisor.regimenFiscal.replace('R', ''), // R601 → 601
      },
      Receptor: {
        Rfc: req.receptor.rfc,
        Nombre: req.receptor.razonSocial,
        UsoCFDI: req.receptor.usoCfdi,
        RegimenFiscalReceptor: req.receptor.regimenFiscal.replace('R', ''),
        DomicilioFiscalReceptor: '',
      },
      Conceptos: req.conceptos.map((c) => ({
        ClaveProdServ: c.claveProdServ,
        Cantidad: c.cantidad,
        ClaveUnidad: c.claveUnidad,
        Unidad: c.unidad || '',
        Descripcion: c.descripcion,
        ValorUnitario: c.valorUnitario,
        Importe: c.importe,
        Descuento: c.descuento,
        ObjetoImp: c.objetoImpuesto,
        Impuestos: c.tasaIVA
          ? {
              Traslados: [
                {
                  Base: c.importe - c.descuento,
                  Impuesto: '002', // IVA
                  TipoFactor: 'Tasa',
                  TasaOCuota: c.tasaIVA,
                  Importe: c.importeIVA || 0,
                },
              ],
            }
          : undefined,
      })),
    }
  }

  private mapFormaPago(forma: string): string {
    const map: Record<string, string> = {
      EFECTIVO: '01',
      CHEQUE_NOMINATIVO: '02',
      TRANSFERENCIA: '03',
      TARJETA_CREDITO: '04',
      TARJETA_DEBITO: '28',
      POR_DEFINIR: '99',
    }
    return map[forma] || '99'
  }

  async timbrar(request: TimbradoRequest): Promise<TimbradoResult> {
    const body = this.mapToFacturaDigitalFormat(request)

    const res = await this.request('POST', '/servicios/timbrar/json', body)

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`[FacturaDigital] Error al timbrar: ${res.status} - ${error}`)
    }

    const data = await res.json()

    // Mapear respuesta de Factura Digital al formato interno
    return {
      success: true,
      uuid: data.UUID || data.uuid || data.TimbreFiscalDigital?.UUID,
      fechaTimbrado: data.FechaTimbrado || data.fechaTimbrado || data.TimbreFiscalDigital?.FechaTimbrado,
      selloCFD: data.SelloCFD || data.selloCFD || data.TimbreFiscalDigital?.SelloCFD || '',
      selloSAT: data.SelloSAT || data.selloSAT || data.TimbreFiscalDigital?.SelloSAT || '',
      noCertificadoSAT: data.NoCertificadoSAT || data.noCertificadoSAT || data.TimbreFiscalDigital?.NoCertificadoSAT || '',
      cadenaOriginal: data.CadenaOriginalSAT || data.cadenaOriginal || '',
      xmlTimbrado: data.XML || data.xml || data.AcuseXml || '',
    }
  }

  async cancelar(request: CancelacionRequest): Promise<CancelacionResult> {
    const body = {
      Uuid: request.uuid,
      RfcEmisor: request.rfcEmisor,
      Motivo: request.motivo,
      FolioSustitucion: request.folioSustitucion || '',
    }

    const res = await this.request('POST', '/servicios/cancelar/csd', body)

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`[FacturaDigital] Error al cancelar: ${res.status} - ${error}`)
    }

    const data = await res.json()

    return {
      success: true,
      acuse: data.Acuse || data.acuse || data.AcuseXml || '',
      fechaCancelacion: data.FechaCancelacion || data.fechaCancelacion || new Date().toISOString(),
    }
  }

  async validarEstatus(request: EstatusRequest): Promise<EstatusResult> {
    const body = {
      Uuid: request.uuid,
      RfcEmisor: request.rfcEmisor,
      RfcReceptor: request.rfcReceptor,
      Total: request.total,
    }

    const res = await this.request('POST', '/validar/estatuscfdi', body)

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`[FacturaDigital] Error al validar estatus: ${res.status} - ${error}`)
    }

    const data = await res.json()

    return {
      success: true,
      esCancelable: data.EsCancelable === 'Cancelable sin aceptación' || data.EsCancelable === true,
      estado: data.Estado || data.estado || 'Desconocido',
    }
  }
}
