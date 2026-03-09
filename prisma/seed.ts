import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const connectionString = process.env.DATABASE_URL!
console.log('Connecting to:', connectionString)
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.concepto.deleteMany()
  await prisma.cfdi.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.reporteMensual.deleteMany()
  await prisma.contribuyente.deleteMany()
  await prisma.user.deleteMany()
  console.log('Cleaned existing data')

  // ─── Users ───────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 10)
  const operadorHash = await bcrypt.hash('operador123', 10)

  const admin = await prisma.user.create({
    data: { email: 'admin@shp.gob.mx', password: passwordHash, name: 'Administrador SHP', role: 'ADMIN' },
  })
  const operador1 = await prisma.user.create({
    data: { email: 'operador@shp.gob.mx', password: operadorHash, name: 'María González', role: 'OPERADOR' },
  })
  const operador2 = await prisma.user.create({
    data: { email: 'operador2@shp.gob.mx', password: operadorHash, name: 'Roberto Hernández', role: 'OPERADOR' },
  })
  const consultor = await prisma.user.create({
    data: { email: 'consultor@shp.gob.mx', password: operadorHash, name: 'Carlos Ramírez', role: 'CONSULTOR' },
  })
  const users = [admin, operador1, operador2, consultor]
  console.log(`${users.length} users created`)

  // ─── Contribuyentes ──────────────────────────────────
  const contribuyentes = await Promise.all([
    prisma.contribuyente.create({ data: { rfc: 'GSH850101AAA', razonSocial: 'Gobierno del Estado - Secretaría de Hacienda Pública', regimenFiscal: 'R603', codigoPostal: '44100', email: 'facturacion@shp.gob.mx', telefono: '33 3030 1000' } }),
    prisma.contribuyente.create({ data: { rfc: 'XAXX010101000', razonSocial: 'Público en General', regimenFiscal: 'R616', codigoPostal: '44100' } }),
    prisma.contribuyente.create({ data: { rfc: 'ABC920515HN3', razonSocial: 'Constructora del Pacífico SA de CV', regimenFiscal: 'R601', codigoPostal: '44600', email: 'contabilidad@constructorapacifico.com', telefono: '33 1234 5678' } }),
    prisma.contribuyente.create({ data: { rfc: 'GOLA800101M45', razonSocial: 'González López Alejandro', regimenFiscal: 'R612', codigoPostal: '44200', email: 'alejandro.gonzalez@email.com' } }),
    prisma.contribuyente.create({ data: { rfc: 'TEC990101AB1', razonSocial: 'Tecnologías Avanzadas del Bajío SA de CV', regimenFiscal: 'R601', codigoPostal: '37000', email: 'fiscal@tecbajio.com', telefono: '477 123 4567' } }),
    prisma.contribuyente.create({ data: { rfc: 'FME010101AA1', razonSocial: 'Farmacéutica Mexicana SA de CV', regimenFiscal: 'R601', codigoPostal: '06600', email: 'facturacion@farmex.com.mx', telefono: '55 9876 5432' } }),
    prisma.contribuyente.create({ data: { rfc: 'MARS850315LK7', razonSocial: 'Martínez Sánchez Rosa Elena', regimenFiscal: 'R625', codigoPostal: '44300', email: 'rosa.martinez@gmail.com' } }),
    prisma.contribuyente.create({ data: { rfc: 'GIN080101AB2', razonSocial: 'Grupo Industrial del Norte SA de CV', regimenFiscal: 'R601', codigoPostal: '64000', email: 'cuentaspagar@ginnorte.com', telefono: '81 8765 4321' } }),
    prisma.contribuyente.create({ data: { rfc: 'LOPH900220JK5', razonSocial: 'López Pérez Hugo Alberto', regimenFiscal: 'R612', codigoPostal: '44500', email: 'hugo.lopez@outlook.com' } }),
    prisma.contribuyente.create({ data: { rfc: 'ASG150101CD3', razonSocial: 'Alimentos y Servicios Gastronómicos SA de CV', regimenFiscal: 'R601', codigoPostal: '45050', email: 'admin@asgastro.com' } }),
    prisma.contribuyente.create({ data: { rfc: 'TORE780510MN8', razonSocial: 'Torres Reyes Enrique', regimenFiscal: 'R606', codigoPostal: '44100', email: 'enrique.torres@yahoo.com' } }),
    prisma.contribuyente.create({ data: { rfc: 'IME200101EF4', razonSocial: 'Inmobiliaria Metrópoli SA de CV', regimenFiscal: 'R601', codigoPostal: '44100', email: 'contabilidad@metropoli.mx', telefono: '33 3333 4444' } }),
    prisma.contribuyente.create({ data: { rfc: 'GAHR880101PQ9', razonSocial: 'García Hernández Ricardo', regimenFiscal: 'R625', codigoPostal: '44600' } }),
    prisma.contribuyente.create({ data: { rfc: 'TRS180101GH5', razonSocial: 'Transportes Rápidos del Sur SA de CV', regimenFiscal: 'R601', codigoPostal: '44900', email: 'facturacion@trsur.com' } }),
    prisma.contribuyente.create({ data: { rfc: 'UDG330101AA1', razonSocial: 'Universidad de Guadalajara', regimenFiscal: 'R603', codigoPostal: '44100', email: 'finanzas@udg.mx' } }),
  ])

  const emisor = contribuyentes[0] // SHP
  const receptores = contribuyentes.slice(1)
  console.log(`${contribuyentes.length} contribuyentes created`)

  // ─── Helper functions ────────────────────────────────
  const tiposCfdi = ['INGRESO', 'INGRESO', 'INGRESO', 'INGRESO', 'EGRESO', 'PAGO'] as const
  const formasPago = ['EFECTIVO', 'CHEQUE_NOMINATIVO', 'TRANSFERENCIA', 'TARJETA_CREDITO', 'TARJETA_DEBITO'] as const
  const metodosPago = ['PUE', 'PUE', 'PUE', 'PPD'] as const
  const usosCfdi = ['G01', 'G03', 'G03', 'G03', 'I04', 'S01', 'P01'] as const

  const conceptosPool = [
    { clave: '80141600', desc: 'Impuesto sobre nóminas', min: 50000, max: 500000 },
    { clave: '93161700', desc: 'Licencia de conducir - Tipo A', min: 1500, max: 3500 },
    { clave: '93161700', desc: 'Licencia de conducir - Tipo B', min: 2000, max: 4000 },
    { clave: '80141600', desc: 'Derechos de registro mercantil', min: 20000, max: 80000 },
    { clave: '80141600', desc: 'Impuesto sobre adquisición de inmuebles', min: 100000, max: 800000 },
    { clave: '93161700', desc: 'Certificado de no adeudo fiscal', min: 500, max: 2000 },
    { clave: '80141600', desc: 'Derechos por expedición de constancias', min: 300, max: 1500 },
    { clave: '93161700', desc: 'Multa administrativa', min: 2000, max: 15000 },
    { clave: '80141600', desc: 'Impuesto sobre hospedaje', min: 5000, max: 50000 },
    { clave: '80141600', desc: 'Derechos de agua', min: 1000, max: 25000 },
    { clave: '93161700', desc: 'Acta de nacimiento', min: 100, max: 500 },
    { clave: '93161700', desc: 'Acta de matrimonio', min: 200, max: 800 },
    { clave: '80141600', desc: 'Derecho vehicular - Tenencia', min: 3000, max: 20000 },
    { clave: '80141600', desc: 'Impuesto ecológico', min: 10000, max: 100000 },
    { clave: '93161700', desc: 'Permiso de uso de suelo', min: 5000, max: 50000 },
    { clave: '80141600', desc: 'Contribución de mejoras', min: 15000, max: 200000 },
  ]

  function rand(min: number, max: number) {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100
  }
  function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  // ─── CFDIs ───────────────────────────────────────────
  let folioCounter = 1
  const allCfdis: { id: string; status: string }[] = []

  // Generate CFDIs across 3 months (Jan, Feb, Mar 2026)
  for (let month = 0; month < 3; month++) {
    const year = 2026
    const m = month + 1 // 1=Jan, 2=Feb, 3=Mar
    const daysInMonth = new Date(year, m, 0).getDate()
    const cfdiCount = month === 2 ? 12 : 25 // fewer in March (current month)

    for (let i = 0; i < cfdiCount; i++) {
      const day = Math.min(Math.floor(Math.random() * daysInMonth) + 1, daysInMonth)
      const hour = Math.floor(Math.random() * 12) + 7
      const fecha = new Date(year, m - 1, day, hour, Math.floor(Math.random() * 60))

      const receptor = pick(receptores)
      const tipo = pick(tiposCfdi)
      const numConceptos = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 2 : 1

      const conceptosData = []
      let subtotal = 0
      for (let c = 0; c < numConceptos; c++) {
        const concepto = pick(conceptosPool)
        const cantidad = Math.random() > 0.8 ? Math.floor(Math.random() * 5) + 2 : 1
        const valorUnitario = rand(concepto.min, concepto.max)
        const importe = Math.round(cantidad * valorUnitario * 100) / 100
        const importeIVA = Math.round(importe * 0.16 * 100) / 100
        subtotal += importe
        conceptosData.push({
          claveProdServ: concepto.clave,
          cantidad,
          claveUnidad: 'E48',
          unidad: 'Unidad de servicio',
          descripcion: concepto.desc,
          valorUnitario,
          importe,
          tasaIVA: 0.16,
          importeIVA,
        })
      }

      subtotal = Math.round(subtotal * 100) / 100
      const totalImpuestos = Math.round(subtotal * 0.16 * 100) / 100
      const total = Math.round((subtotal + totalImpuestos) * 100) / 100

      // Status distribution: 70% timbrado, 10% cancelado, 10% pendiente, 10% error
      const r = Math.random()
      let status: string
      if (month === 2 && i >= cfdiCount - 4) {
        // Last 4 of current month are pendiente
        status = 'PENDIENTE'
      } else if (r < 0.72) {
        status = 'TIMBRADO'
      } else if (r < 0.82) {
        status = 'CANCELADO'
      } else if (r < 0.92) {
        status = 'PENDIENTE'
      } else {
        status = 'ERROR'
      }

      const timbradoData: Record<string, unknown> = {}
      if (status === 'TIMBRADO' || status === 'CANCELADO') {
        const timbradoDate = new Date(fecha.getTime() + Math.random() * 3600000)
        timbradoData.uuid = randomUUID()
        timbradoData.fechaTimbrado = timbradoDate
        timbradoData.selloCFD = `SELLO_CFD_${randomUUID().substring(0, 8)}`
        timbradoData.selloSAT = `SELLO_SAT_${randomUUID().substring(0, 8)}`
        timbradoData.noCertificadoSAT = '30001000000400002434'
        timbradoData.cadenaOriginal = `||1.1|${timbradoData.uuid}|${timbradoDate.toISOString()}||`
      }

      const cancelData: Record<string, unknown> = {}
      if (status === 'CANCELADO') {
        const cancelDate = new Date(fecha.getTime() + Math.random() * 86400000 * 3)
        cancelData.fechaCancelacion = cancelDate
        cancelData.motivoCancelacion = pick(['01', '02', '03'])
      }

      const folio = String(folioCounter++).padStart(6, '0')

      const cfdi = await prisma.cfdi.create({
        data: {
          serie: 'A',
          folio,
          fecha,
          tipo: tipo as string,
          status: status as string,
          usoCfdi: pick(usosCfdi) as string,
          metodoPago: pick(metodosPago) as string,
          formaPago: pick(formasPago) as string,
          lugarExpedicion: '44100',
          subtotal,
          totalImpuestos,
          total,
          emisorId: emisor.id,
          receptorId: receptor.id,
          createdById: pick([operador1, operador2, admin]).id,
          ...timbradoData,
          ...cancelData,
          conceptos: { create: conceptosData },
        } as Record<string, unknown>,
      })

      allCfdis.push({ id: cfdi.id, status })
    }
  }

  console.log(`${allCfdis.length} CFDIs created`)
  console.log(`  - Timbrados: ${allCfdis.filter(c => c.status === 'TIMBRADO').length}`)
  console.log(`  - Cancelados: ${allCfdis.filter(c => c.status === 'CANCELADO').length}`)
  console.log(`  - Pendientes: ${allCfdis.filter(c => c.status === 'PENDIENTE').length}`)
  console.log(`  - Errores: ${allCfdis.filter(c => c.status === 'ERROR').length}`)

  // ─── Incidencias ─────────────────────────────────────
  const incidentsData = [
    { titulo: 'Error de conexión con PAC durante timbrado masivo', descripcion: 'Al intentar timbrar un lote de 500 CFDIs, la conexión con el PAC se interrumpió después del comprobante 342. Se requiere reintento de los comprobantes restantes.', priority: 'ALTA', status: 'RESUELTO', fechaReporte: new Date('2026-01-15T08:00:00'), fechaAtencion: new Date('2026-01-15T08:20:00'), fechaResolucion: new Date('2026-01-15T08:50:00'), tiempoAtencionMinutos: 20, tiempoResolucionMinutos: 50, cumpleSLA: true, categoria: 'CONECTIVIDAD', resolucion: 'Se identificó un timeout en la configuración del PAC. Se ajustó el parámetro y se reprocesaron los CFDIs pendientes exitosamente.', createdById: operador1.id },
    { titulo: 'Certificado CSD próximo a expirar', descripcion: 'El certificado de sello digital del emisor principal vence en 15 días. Se requiere renovación urgente ante el SAT.', priority: 'ALTA', status: 'RESUELTO', fechaReporte: new Date('2026-01-20T09:00:00'), fechaAtencion: new Date('2026-01-20T09:10:00'), fechaResolucion: new Date('2026-01-20T10:30:00'), tiempoAtencionMinutos: 10, tiempoResolucionMinutos: 90, cumpleSLA: false, categoria: 'CERTIFICADOS', resolucion: 'Se renovó el CSD ante el SAT y se actualizó en el sistema.', createdById: admin.id },
    { titulo: 'CFDI rechazado por RFC inválido en LRFC', descripcion: 'El receptor con RFC XYZW010101000 fue rechazado por el PAC al no encontrarse en la Lista de RFC del SAT. El contribuyente reporta que su RFC es correcto.', priority: 'MEDIA', status: 'RESUELTO', fechaReporte: new Date('2026-01-25T14:00:00'), fechaAtencion: new Date('2026-01-25T15:00:00'), fechaResolucion: new Date('2026-01-25T17:00:00'), tiempoAtencionMinutos: 60, tiempoResolucionMinutos: 180, cumpleSLA: true, categoria: 'VALIDACION', resolucion: 'Se verificó que el RFC tenía un error de captura. Se corrigió y se reenvió el CFDI.', createdById: operador2.id },
    { titulo: 'Timeout en generación de PDF masiva', descripcion: 'Al generar PDFs de 200 CFDIs simultáneamente, el servicio devuelve timeout después de 30 segundos. Funciona correctamente con lotes menores a 50.', priority: 'MEDIA', status: 'RESUELTO', fechaReporte: new Date('2026-02-03T10:00:00'), fechaAtencion: new Date('2026-02-03T11:30:00'), fechaResolucion: new Date('2026-02-03T16:00:00'), tiempoAtencionMinutos: 90, tiempoResolucionMinutos: 360, cumpleSLA: true, categoria: 'TIMBRADO', resolucion: 'Se implementó procesamiento por lotes de 50 documentos con cola de espera.', createdById: operador1.id },
    { titulo: 'Cambio en Anexo 20 - Nuevos campos obligatorios', descripcion: 'El SAT publicó actualización al Anexo 20 con nuevos campos obligatorios para CFDI de nómina. Se requiere actualización del sistema antes del 1 de abril.', priority: 'ALTA', status: 'RESUELTO', fechaReporte: new Date('2026-02-10T08:00:00'), fechaAtencion: new Date('2026-02-10T08:15:00'), fechaResolucion: new Date('2026-02-10T08:55:00'), tiempoAtencionMinutos: 15, tiempoResolucionMinutos: 55, cumpleSLA: true, categoria: 'VALIDACION', resolucion: 'PAC actualizó su sistema. Se validaron los nuevos campos en sandbox exitosamente.', createdById: admin.id },
    { titulo: 'Detección de EFOS en receptor frecuente', descripcion: 'El contribuyente con RFC FME010101AA1 apareció en la lista de EFOS (artículo 69-B del CFF). Se generaron 15 CFDIs en el último mes para este receptor.', priority: 'ALTA', status: 'EN_ATENCION', fechaReporte: new Date('2026-02-18T11:00:00'), fechaAtencion: new Date('2026-02-18T11:25:00'), tiempoAtencionMinutos: 25, categoria: 'VALIDACION', createdById: operador1.id },
    { titulo: 'Error en cálculo de IVA para concepto exento', descripcion: 'Al generar CFDI con conceptos exentos de IVA (tasa 0%), el sistema calcula IVA al 16%. Afecta a los CFDI de servicios educativos.', priority: 'MEDIA', status: 'EN_ATENCION', fechaReporte: new Date('2026-02-25T09:30:00'), fechaAtencion: new Date('2026-02-25T11:00:00'), tiempoAtencionMinutos: 90, categoria: 'TIMBRADO', createdById: operador2.id },
    { titulo: 'Actualización de catálogo de productos SAT', descripcion: 'Se requiere actualizar el catálogo de claves de productos y servicios del SAT a la versión más reciente publicada el 1 de marzo.', priority: 'MEDIA', status: 'ABIERTO', fechaReporte: new Date('2026-03-01T10:00:00'), categoria: 'VALIDACION', createdById: admin.id },
    { titulo: 'Solicitud de reporte personalizado de cancelaciones', descripcion: 'El área de contabilidad solicita un reporte con el detalle de todas las cancelaciones del mes de enero, incluyendo motivos y montos.', priority: 'BAJA', status: 'ABIERTO', fechaReporte: new Date('2026-03-03T14:00:00'), categoria: 'OTRO', createdById: consultor.id },
    { titulo: 'Capacitación para nuevos operadores', descripcion: 'Se incorporan 3 nuevos operadores al equipo de facturación. Se requiere capacitación en el uso del sistema y normativa SAT vigente.', priority: 'BAJA', status: 'ABIERTO', fechaReporte: new Date('2026-03-05T09:00:00'), categoria: 'OTRO', createdById: admin.id },
    { titulo: 'Caída del servicio PAC por mantenimiento no programado', descripcion: 'El PAC reportó una interrupción no programada de 45 minutos. Se acumularon 120 CFDIs sin timbrar durante el periodo de indisponibilidad.', priority: 'ALTA', status: 'RESUELTO', fechaReporte: new Date('2026-02-05T16:00:00'), fechaAtencion: new Date('2026-02-05T16:10:00'), fechaResolucion: new Date('2026-02-05T16:55:00'), tiempoAtencionMinutos: 10, tiempoResolucionMinutos: 55, cumpleSLA: true, categoria: 'CONECTIVIDAD', resolucion: 'PAC restauró servicio. Se retimbraron los 120 CFDIs pendientes exitosamente.', createdById: operador1.id },
    { titulo: 'Solicitud de integración con sistema contable', descripcion: 'El departamento de contabilidad requiere una integración automática para enviar los XML timbrados al sistema contable SAP.', priority: 'BAJA', status: 'CERRADO', fechaReporte: new Date('2026-01-10T10:00:00'), fechaAtencion: new Date('2026-01-10T14:00:00'), fechaResolucion: new Date('2026-01-15T18:00:00'), tiempoAtencionMinutos: 240, tiempoResolucionMinutos: 7680, cumpleSLA: false, categoria: 'OTRO', resolucion: 'Se documentó el requerimiento y se programó para la fase 2 del proyecto.', createdById: consultor.id },
    { titulo: 'Error de validación LCO en contribuyente obligado', descripcion: 'Un contribuyente de la Lista de Contribuyentes Obligados no está siendo detectado correctamente. El sistema permite emitir sin validación adicional.', priority: 'MEDIA', status: 'ABIERTO', fechaReporte: new Date('2026-03-07T11:00:00'), categoria: 'VALIDACION', createdById: operador2.id },
  ]

  for (const inc of incidentsData) {
    await prisma.incident.create({ data: inc as Record<string, unknown> })
  }
  console.log(`${incidentsData.length} incidents created`)

  // ─── Reportes mensuales ──────────────────────────────
  const reportes = [
    { mes: 10, anio: 2025, totalTimbrados: 280500, totalCancelados: 850, totalErrores: 28, montoTotal: 385000000, timbresConsumidos: 280500, timbresDisponibles: 3719500, incidentesAlta: 1, incidentesMedia: 2, incidentesBaja: 4, cumplimientoSLA: 100 },
    { mes: 11, anio: 2025, totalTimbrados: 295000, totalCancelados: 920, totalErrores: 35, montoTotal: 398000000, timbresConsumidos: 295000, timbresDisponibles: 3424500, incidentesAlta: 0, incidentesMedia: 3, incidentesBaja: 2, cumplimientoSLA: 100 },
    { mes: 12, anio: 2025, totalTimbrados: 310200, totalCancelados: 1100, totalErrores: 42, montoTotal: 425000000, timbresConsumidos: 310200, timbresDisponibles: 3114300, incidentesAlta: 2, incidentesMedia: 1, incidentesBaja: 3, cumplimientoSLA: 83 },
    { mes: 1, anio: 2026, totalTimbrados: 298150, totalCancelados: 980, totalErrores: 32, montoTotal: 412300000, timbresConsumidos: 298150, timbresDisponibles: 3701850, incidentesAlta: 2, incidentesMedia: 1, incidentesBaja: 2, cumplimientoSLA: 80 },
    { mes: 2, anio: 2026, totalTimbrados: 325420, totalCancelados: 1250, totalErrores: 45, montoTotal: 458750000, timbresConsumidos: 325420, timbresDisponibles: 3376430, incidentesAlta: 3, incidentesMedia: 2, incidentesBaja: 1, cumplimientoSLA: 92 },
  ]

  for (const r of reportes) {
    await prisma.reporteMensual.create({ data: r })
  }
  console.log(`${reportes.length} monthly reports created`)

  // ─── PAC config ──────────────────────────────────────
  await prisma.configuracionPAC.create({
    data: {
      nombre: 'PAC Demo (Sandbox)',
      apiUrl: 'https://api.pac-provider.com/v1',
      apiUrlSandbox: 'https://sandbox.pac-provider.com/v1',
      apiKey: 'sandbox_key_abc123',
      apiSecret: 'sandbox_secret_xyz789',
      sandbox: true,
      active: true,
    },
  })
  console.log('PAC configuration created')

  console.log('\nSeed completed!')
  console.log('')
  console.log('Credenciales de acceso:')
  console.log('  Admin:     admin@shp.gob.mx / admin123')
  console.log('  Operador:  operador@shp.gob.mx / operador123')
  console.log('  Operador2: operador2@shp.gob.mx / operador123')
  console.log('  Consultor: consultor@shp.gob.mx / operador123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
