import { randomUUID } from 'crypto'
import type {
  PacProvider,
  TimbradoRequest,
  TimbradoResult,
  CancelacionRequest,
  CancelacionResult,
  EstatusRequest,
  EstatusResult,
} from './types'

// Mock PAC para desarrollo y pruebas (sin valor fiscal)
export class MockPacProvider implements PacProvider {
  nombre = 'Mock PAC (Sandbox)'

  async timbrar(request: TimbradoRequest): Promise<TimbradoResult> {
    // Simula latencia de red
    await new Promise((r) => setTimeout(r, 200))

    const uuid = randomUUID()
    const now = new Date().toISOString()
    const selloCFD = Buffer.from(`CFD-${uuid}-${Date.now()}`).toString('base64')
    const selloSAT = Buffer.from(`SAT-${uuid}-${Date.now()}`).toString('base64')
    const noCertificado = '30001000000400002434'

    return {
      success: true,
      uuid,
      fechaTimbrado: now,
      selloCFD,
      selloSAT,
      noCertificadoSAT: noCertificado,
      cadenaOriginal: `||1.1|${uuid}|${now}|${selloCFD}|${noCertificado}||`,
      xmlTimbrado: this.generarXmlMock(request, uuid, now, selloCFD, selloSAT, noCertificado),
    }
  }

  async cancelar(request: CancelacionRequest): Promise<CancelacionResult> {
    await new Promise((r) => setTimeout(r, 150))

    return {
      success: true,
      acuse: `ACU-${Date.now()}-${request.uuid.slice(0, 8)}`,
      fechaCancelacion: new Date().toISOString(),
    }
  }

  async validarEstatus(request: EstatusRequest): Promise<EstatusResult> {
    await new Promise((r) => setTimeout(r, 100))

    return {
      success: true,
      esCancelable: true,
      estado: 'Vigente',
    }
  }

  private generarXmlMock(
    req: TimbradoRequest,
    uuid: string,
    fecha: string,
    selloCFD: string,
    selloSAT: string,
    noCert: string
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
  Version="4.0"
  Serie="${req.comprobante.serie || ''}"
  Folio="${req.comprobante.folio || ''}"
  Fecha="${req.comprobante.fecha}"
  SubTotal="${req.comprobante.subtotal}"
  Total="${req.comprobante.total}"
  Moneda="${req.comprobante.moneda}"
  TipoDeComprobante="${req.comprobante.tipo}"
  MetodoPago="${req.comprobante.metodoPago}"
  FormaPago="${req.comprobante.formaPago}"
  LugarExpedicion="${req.comprobante.lugarExpedicion}"
  Sello="${selloCFD}"
  NoCertificado="${noCert}">
  <cfdi:Emisor Rfc="${req.emisor.rfc}" Nombre="${req.emisor.razonSocial}" RegimenFiscal="${req.emisor.regimenFiscal}" />
  <cfdi:Receptor Rfc="${req.receptor.rfc}" Nombre="${req.receptor.razonSocial}" UsoCFDI="${req.receptor.usoCfdi}" RegimenFiscalReceptor="${req.receptor.regimenFiscal}" />
  <cfdi:Conceptos>
    ${req.conceptos.map((c) => `<cfdi:Concepto ClaveProdServ="${c.claveProdServ}" Cantidad="${c.cantidad}" ClaveUnidad="${c.claveUnidad}" Descripcion="${c.descripcion}" ValorUnitario="${c.valorUnitario}" Importe="${c.importe}" />`).join('\n    ')}
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="${uuid}" FechaTimbrado="${fecha}" SelloCFD="${selloCFD}" SelloSAT="${selloSAT}" NoCertificadoSAT="${noCert}" />
  </cfdi:Complemento>
</cfdi:Comprobante>`
  }
}
