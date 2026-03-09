// Interfaces compartidas para cualquier proveedor PAC

export interface TimbradoRequest {
  // Datos del CFDI para timbrar
  emisor: {
    rfc: string
    razonSocial: string
    regimenFiscal: string
  }
  receptor: {
    rfc: string
    razonSocial: string
    regimenFiscal: string
    usoCfdi: string
  }
  comprobante: {
    serie?: string
    folio?: string
    fecha: string
    tipo: string
    metodoPago: string
    formaPago: string
    moneda: string
    tipoCambio: number
    lugarExpedicion: string
    subtotal: number
    descuento: number
    totalImpuestos: number
    total: number
  }
  conceptos: {
    claveProdServ: string
    cantidad: number
    claveUnidad: string
    unidad?: string
    descripcion: string
    valorUnitario: number
    importe: number
    descuento: number
    objetoImpuesto: string
    tasaIVA?: number
    importeIVA?: number
  }[]
}

export interface TimbradoResult {
  success: boolean
  uuid: string
  fechaTimbrado: string
  selloCFD: string
  selloSAT: string
  noCertificadoSAT: string
  cadenaOriginal: string
  xmlTimbrado: string
}

export interface CancelacionRequest {
  uuid: string
  rfcEmisor: string
  motivo: string
  folioSustitucion?: string
}

export interface CancelacionResult {
  success: boolean
  acuse: string
  fechaCancelacion: string
}

export interface EstatusRequest {
  uuid: string
  rfcEmisor: string
  rfcReceptor: string
  total: string
}

export interface EstatusResult {
  success: boolean
  esCancelable: boolean
  estado: string
}

// Interfaz que debe implementar cualquier proveedor PAC
export interface PacProvider {
  nombre: string
  timbrar(request: TimbradoRequest): Promise<TimbradoResult>
  cancelar(request: CancelacionRequest): Promise<CancelacionResult>
  validarEstatus(request: EstatusRequest): Promise<EstatusResult>
}
