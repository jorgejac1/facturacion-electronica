-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERADOR', 'CONSULTOR');

-- CreateEnum
CREATE TYPE "CfdiStatus" AS ENUM ('PENDIENTE', 'TIMBRADO', 'CANCELADO', 'ERROR');

-- CreateEnum
CREATE TYPE "CfdiTipo" AS ENUM ('INGRESO', 'EGRESO', 'TRASLADO', 'NOMINA', 'PAGO');

-- CreateEnum
CREATE TYPE "UsoCfdi" AS ENUM ('G01', 'G02', 'G03', 'I01', 'I02', 'I03', 'I04', 'D01', 'D04', 'P01', 'S01', 'CP01');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('PUE', 'PPD');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('EFECTIVO', 'CHEQUE_NOMINATIVO', 'TRANSFERENCIA', 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'POR_DEFINIR');

-- CreateEnum
CREATE TYPE "RegimenFiscal" AS ENUM ('R601', 'R603', 'R605', 'R606', 'R608', 'R612', 'R616', 'R625', 'R626');

-- CreateEnum
CREATE TYPE "IncidentPriority" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('ABIERTO', 'EN_ATENCION', 'RESUELTO', 'CERRADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERADOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contribuyentes" (
    "id" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "regimenFiscal" "RegimenFiscal" NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contribuyentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cfdis" (
    "id" TEXT NOT NULL,
    "serie" TEXT,
    "folio" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "CfdiTipo" NOT NULL DEFAULT 'INGRESO',
    "status" "CfdiStatus" NOT NULL DEFAULT 'PENDIENTE',
    "usoCfdi" "UsoCfdi" NOT NULL DEFAULT 'G03',
    "metodoPago" "MetodoPago" NOT NULL DEFAULT 'PUE',
    "formaPago" "FormaPago" NOT NULL DEFAULT 'TRANSFERENCIA',
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "tipoCambio" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "lugarExpedicion" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalImpuestos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "uuid" TEXT,
    "fechaTimbrado" TIMESTAMP(3),
    "selloCFD" TEXT,
    "selloSAT" TEXT,
    "noCertificadoSAT" TEXT,
    "cadenaOriginal" TEXT,
    "xmlTimbrado" TEXT,
    "pdfUrl" TEXT,
    "fechaCancelacion" TIMESTAMP(3),
    "motivoCancelacion" TEXT,
    "folioSustitucion" TEXT,
    "emisorId" TEXT NOT NULL,
    "receptorId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cfdis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conceptos" (
    "id" TEXT NOT NULL,
    "claveProdServ" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "claveUnidad" TEXT NOT NULL,
    "unidad" TEXT,
    "descripcion" TEXT NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "objetoImpuesto" TEXT NOT NULL DEFAULT '02',
    "tasaIVA" DOUBLE PRECISION DEFAULT 0.16,
    "importeIVA" DOUBLE PRECISION DEFAULT 0,
    "tasaISR" DOUBLE PRECISION,
    "importeISR" DOUBLE PRECISION DEFAULT 0,
    "cfdiId" TEXT NOT NULL,

    CONSTRAINT "conceptos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "priority" "IncidentPriority" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'ABIERTO',
    "fechaReporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAtencion" TIMESTAMP(3),
    "fechaResolucion" TIMESTAMP(3),
    "tiempoAtencionMinutos" INTEGER,
    "tiempoResolucionMinutos" INTEGER,
    "cumpleSLA" BOOLEAN,
    "categoria" TEXT,
    "resolucion" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_mensuales" (
    "id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "totalTimbrados" INTEGER NOT NULL DEFAULT 0,
    "totalCancelados" INTEGER NOT NULL DEFAULT 0,
    "totalErrores" INTEGER NOT NULL DEFAULT 0,
    "montoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timbresConsumidos" INTEGER NOT NULL DEFAULT 0,
    "timbresDisponibles" INTEGER NOT NULL DEFAULT 0,
    "incidentesAlta" INTEGER NOT NULL DEFAULT 0,
    "incidentesMedia" INTEGER NOT NULL DEFAULT 0,
    "incidentesBaja" INTEGER NOT NULL DEFAULT 0,
    "cumplimientoSLA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_mensuales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_pac" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "apiUrlSandbox" TEXT,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "certificadoPEM" TEXT,
    "llavePrivadaPEM" TEXT,
    "passwordLlave" TEXT,
    "sandbox" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pac_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contribuyentes_rfc_key" ON "contribuyentes"("rfc");

-- CreateIndex
CREATE UNIQUE INDEX "cfdis_uuid_key" ON "cfdis"("uuid");

-- CreateIndex
CREATE INDEX "cfdis_status_idx" ON "cfdis"("status");

-- CreateIndex
CREATE INDEX "cfdis_emisorId_idx" ON "cfdis"("emisorId");

-- CreateIndex
CREATE INDEX "cfdis_receptorId_idx" ON "cfdis"("receptorId");

-- CreateIndex
CREATE INDEX "cfdis_fecha_idx" ON "cfdis"("fecha");

-- CreateIndex
CREATE INDEX "cfdis_uuid_idx" ON "cfdis"("uuid");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_priority_idx" ON "incidents"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "reportes_mensuales_mes_anio_key" ON "reportes_mensuales"("mes", "anio");

-- AddForeignKey
ALTER TABLE "cfdis" ADD CONSTRAINT "cfdis_emisorId_fkey" FOREIGN KEY ("emisorId") REFERENCES "contribuyentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cfdis" ADD CONSTRAINT "cfdis_receptorId_fkey" FOREIGN KEY ("receptorId") REFERENCES "contribuyentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cfdis" ADD CONSTRAINT "cfdis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conceptos" ADD CONSTRAINT "conceptos_cfdiId_fkey" FOREIGN KEY ("cfdiId") REFERENCES "cfdis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
