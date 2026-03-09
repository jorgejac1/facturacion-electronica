# Sistema de Facturación Electrónica — SHP

Sistema integral de gestión de Comprobantes Fiscales Digitales por Internet (CFDI) para la Secretaría de Hacienda Pública. Maneja el ciclo de vida completo de facturación electrónica: emisión, timbrado, cancelación, seguimiento de incidencias con SLAs y reportes mensuales.

---

## Tabla de Contenidos

- [Tech Stack](#tech-stack)
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Modelo de Datos](#modelo-de-datos)
- [Features](#features)
  - [Autenticación y Roles](#1-autenticación-y-roles)
  - [Dashboard](#2-dashboard)
  - [Gestión de CFDIs](#3-gestión-de-cfdis)
  - [Timbrado (PAC)](#4-timbrado-pac)
  - [Cancelación](#5-cancelación)
  - [Contribuyentes](#6-contribuyentes)
  - [Incidencias y SLA](#7-incidencias-y-sla)
  - [Reportes Mensuales](#8-reportes-mensuales)
  - [Configuración PAC](#9-configuración-pac)
- [API Reference](#api-reference)
- [Componentes UI](#componentes-ui)
- [Instalación y Setup](#instalación-y-setup)
- [Datos de Demostración](#datos-de-demostración)

---

## Tech Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | Next.js (App Router) | 16 |
| **Lenguaje** | TypeScript | 5 |
| **UI** | React | 19 |
| **Estilos** | Tailwind CSS | 4 |
| **ORM** | Prisma + `@prisma/adapter-pg` | 7 |
| **Base de datos** | PostgreSQL | 15+ |
| **Autenticación** | NextAuth (Auth.js) v5 beta | 5.0 beta |
| **Hashing** | bcryptjs | — |
| **Validación** | Zod | — |
| **Gráficas** | Recharts | — |
| **Iconos** | Lucide React | — |
| **Componentes** | Headless UI | — |
| **Fechas** | date-fns | — |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  Login   │  │Dashboard │  │  CFDIs   │  │Incidencias  │ │
│  │  Page    │  │  Page    │  │  CRUD    │  │   & SLA     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘ │
└───────┼──────────────┼─────────────┼───────────────┼────────┘
        │              │             │               │
        ▼              ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE (Auth Check)                    │
│              Cookie-based session verification                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                     │
│                                                               │
│  /api/auth/*          NextAuth endpoints                      │
│  /api/cfdis/*         CFDI CRUD + timbrar + cancelar          │
│  /api/contribuyentes/* Gestión de contribuyentes              │
│  /api/incidencias/*   Incidencias con cálculo SLA             │
│  /api/dashboard       KPIs agregados                          │
│  /api/reportes        Generación de reportes mensuales        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                  ┌─────────┼─────────┐
                  │         │         │
                  ▼         ▼         ▼
           ┌──────────┐ ┌──────┐ ┌──────────┐
           │  Prisma   │ │ PAC  │ │ NextAuth │
           │  Client   │ │Client│ │  (JWT)   │
           │(Singleton)│ │(Mock)│ │          │
           └─────┬─────┘ └──────┘ └──────────┘
                 │
                 ▼
           ┌──────────┐
           │PostgreSQL │
           │    DB     │
           └──────────┘
```

### Decisiones Arquitectónicas Clave

1. **Prisma 7 con Adapter Pattern**: Se usa `@prisma/adapter-pg` (`PrismaPg`) en lugar de la conexión directa. El `datasource` en el schema no tiene `url` — se configura en `prisma.config.ts`.

2. **Cliente generado**: Prisma genera el cliente en `src/generated/prisma/client` (no en `@prisma/client`). Las importaciones de enums son desde `@/generated/prisma/client`.

3. **Middleware simplificado**: Se usa verificación de cookie (`authjs.session-token`) en lugar del middleware de NextAuth para evitar problemas con Prisma en edge runtime.

4. **Sesión extendida**: JWT enriquecido con `id` y `role` del usuario a través de callbacks en NextAuth, propagados a la sesión del cliente.

5. **PAC Mock**: El cliente PAC (`src/lib/pac/client.ts`) es un mock para sandbox que simula timbrado/cancelación. En producción se reemplaza con la integración real al PAC autorizado.

6. **Server Components + Client Components**: Las páginas usan `'use client'` para interactividad. Los API routes manejan toda la lógica de negocio server-side.

---

## Estructura del Proyecto

```
facturacion-electronica/
├── prisma/
│   ├── schema.prisma            # 7 modelos, 10 enums
│   └── seed.ts                  # Datos demo (4 usuarios, 15 contribuyentes, 62 CFDIs, 13 incidencias)
├── prisma.config.ts             # Config Prisma 7 (DATABASE_URL)
├── src/
│   ├── app/
│   │   ├── globals.css          # Tailwind 4 + variables CSS
│   │   ├── layout.tsx           # Root layout (HTML, fonts)
│   │   ├── page.tsx             # Redirect → /dashboard
│   │   ├── (auth)/
│   │   │   ├── layout.tsx       # Layout limpio (sin sidebar)
│   │   │   └── login/page.tsx   # Login + quick-access demo buttons
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # DashboardLayout wrapper
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── cfdis/
│   │   │   │   ├── page.tsx        # Listado con filtros y paginación
│   │   │   │   ├── nuevo/page.tsx  # Formulario de creación
│   │   │   │   └── [id]/page.tsx   # Detalle + acciones timbrar/cancelar
│   │   │   ├── contribuyentes/
│   │   │   │   ├── page.tsx        # Listado con búsqueda
│   │   │   │   └── nuevo/page.tsx  # Formulario de registro
│   │   │   ├── incidencias/
│   │   │   │   ├── page.tsx        # Listado + card SLA
│   │   │   │   └── nueva/page.tsx  # Formulario de reporte
│   │   │   ├── reportes/page.tsx   # Generación y listado mensual
│   │   │   └── configuracion/page.tsx # Config PAC + certificados
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── cfdis/
│   │       │   ├── route.ts              # GET (list) + POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET (detail) + DELETE
│   │       │       ├── timbrar/route.ts  # POST → timbrar con PAC
│   │       │       └── cancelar/route.ts # POST → cancelar con PAC
│   │       ├── contribuyentes/
│   │       │   ├── route.ts              # GET + POST
│   │       │   └── [id]/route.ts         # GET + PUT + DELETE
│   │       ├── incidencias/
│   │       │   ├── route.ts              # GET + POST
│   │       │   └── [id]/route.ts         # GET + PATCH (con SLA auto)
│   │       ├── dashboard/route.ts        # GET → KPIs agregados
│   │       └── reportes/route.ts         # GET + generate
│   ├── components/
│   │   ├── layout/
│   │   │   ├── dashboard-layout.tsx  # Sidebar + Topbar + contenido
│   │   │   ├── sidebar.tsx           # Navegación lateral colapsable
│   │   │   └── topbar.tsx            # Barra superior mobile
│   │   └── ui/
│   │       ├── button.tsx    # Variantes: primary, secondary, danger, ghost
│   │       ├── card.tsx      # Contenedor con header/title/content/footer
│   │       ├── badge.tsx     # Indicadores de estado con colores
│   │       ├── input.tsx     # Input con label y error
│   │       ├── select.tsx    # Select con label y error
│   │       ├── modal.tsx     # Modal controlado
│   │       ├── table.tsx     # Tabla semántica reutilizable
│   │       └── stat-card.tsx # Card KPI con icono y valor
│   ├── lib/
│   │   ├── auth.ts           # NextAuth config (credentials, JWT, session)
│   │   ├── prisma.ts         # Prisma singleton con PrismaPg adapter
│   │   ├── utils.ts          # cn(), formatCurrency(), formatRFC(), etc.
│   │   └── pac/
│   │       └── client.ts     # Mock PAC: timbrar(), cancelar(), validarEstatus()
│   ├── types/
│   │   └── next-auth.d.ts    # Extensión de tipos: User + Session + JWT con role
│   └── middleware.ts          # Auth guard por cookie
├── .env                       # Variables (auto-generated por Prisma)
├── .env.local                 # Variables reales (DATABASE_URL, AUTH_SECRET)
├── package.json
├── tsconfig.json              # Path alias: @/* → ./src/*
├── next.config.ts
└── postcss.config.mjs
```

---

## Modelo de Datos

### Diagrama de Relaciones

```
User (users)
 ├── 1:N → Cfdi         (createdBy)
 └── 1:N → Incident     (createdBy)

Contribuyente (contribuyentes)
 ├── 1:N → Cfdi         (emisor)
 └── 1:N → Cfdi         (receptor)

Cfdi (cfdis)
 ├── N:1 → User          (createdBy)
 ├── N:1 → Contribuyente (emisor)
 ├── N:1 → Contribuyente (receptor)
 └── 1:N → Concepto      (conceptos)

Concepto (conceptos)
 └── N:1 → Cfdi

Incident (incidents)
 └── N:1 → User          (createdBy)

ReporteMensual (reportes_mensuales)  [standalone]
ConfiguracionPAC (configuracion_pac) [standalone]
```

### Enums

| Enum | Valores | Uso |
|------|---------|-----|
| `UserRole` | ADMIN, OPERADOR, CONSULTOR | Rol del usuario |
| `CfdiStatus` | PENDIENTE, TIMBRADO, CANCELADO, ERROR | Estado del CFDI |
| `CfdiTipo` | INGRESO, EGRESO, TRASLADO, NOMINA, PAGO | Tipo de comprobante |
| `UsoCfdi` | G01, G02, G03, I01–I04, D01, D04, P01, S01, CP01 | Uso fiscal (catálogo SAT) |
| `MetodoPago` | PUE, PPD | Método de pago |
| `FormaPago` | EFECTIVO, CHEQUE_NOMINATIVO, TRANSFERENCIA, TARJETA_CREDITO, TARJETA_DEBITO, POR_DEFINIR | Forma de pago |
| `RegimenFiscal` | R601, R603, R605, R606, R608, R612, R616, R625, R626 | Régimen fiscal SAT |
| `IncidentPriority` | ALTA, MEDIA, BAJA | Prioridad de incidencia |
| `IncidentStatus` | ABIERTO, EN_ATENCION, RESUELTO, CERRADO | Estado de incidencia |

### Modelos Detallados

#### User
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (CUID) | Identificador único |
| email | String (unique) | Correo electrónico |
| password | String | Hash bcrypt |
| name | String | Nombre completo |
| role | UserRole | ADMIN / OPERADOR / CONSULTOR |
| active | Boolean | Estado activo/inactivo |

#### Contribuyente
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (CUID) | Identificador único |
| rfc | String (unique) | RFC del contribuyente |
| razonSocial | String | Nombre o razón social |
| regimenFiscal | RegimenFiscal | Régimen fiscal SAT |
| codigoPostal | String | Código postal fiscal |
| email | String? | Correo de contacto |
| telefono | String? | Teléfono de contacto |

#### Cfdi
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String (CUID) | Identificador único |
| serie / folio | String? | Serie y folio del comprobante |
| fecha | DateTime | Fecha de emisión |
| tipo | CfdiTipo | Tipo de comprobante |
| status | CfdiStatus | Estado actual |
| usoCfdi | UsoCfdi | Uso del CFDI (catálogo SAT) |
| metodoPago | MetodoPago | PUE o PPD |
| formaPago | FormaPago | Forma de pago |
| moneda | String | Moneda (default: MXN) |
| tipoCambio | Float | Tipo de cambio |
| lugarExpedicion | String | CP del lugar de expedición |
| subtotal | Float | Subtotal antes de impuestos |
| descuento | Float | Descuento total |
| totalImpuestos | Float | Total de impuestos |
| total | Float | Total del comprobante |
| **Datos de timbrado** | | |
| uuid | String? (unique) | UUID fiscal (asignado por PAC) |
| fechaTimbrado | DateTime? | Fecha/hora de timbrado |
| selloCFD / selloSAT | Text? | Sellos digitales |
| noCertificadoSAT | String? | Número de certificado SAT |
| cadenaOriginal | Text? | Cadena original de complemento |
| xmlTimbrado | Text? | XML completo timbrado |
| **Datos de cancelación** | | |
| fechaCancelacion | DateTime? | Fecha de cancelación |
| motivoCancelacion | String? | Motivo de cancelación (catálogo SAT) |
| folioSustitucion | String? | Folio que sustituye (si aplica) |

#### Concepto (línea de detalle)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| claveProdServ | String | Clave producto/servicio SAT |
| cantidad | Float | Cantidad |
| claveUnidad | String | Clave unidad SAT |
| unidad | String? | Descripción de unidad |
| descripcion | String | Descripción del concepto |
| valorUnitario | Float | Precio unitario |
| importe | Float | Importe (cantidad × precio) |
| descuento | Float | Descuento del concepto |
| objetoImpuesto | String | Objeto de impuesto (default: "02") |
| tasaIVA | Float? | Tasa de IVA (default: 0.16) |
| importeIVA | Float? | Importe de IVA calculado |

#### Incident
| Campo | Tipo | Descripción |
|-------|------|-------------|
| titulo | String | Título de la incidencia |
| descripcion | Text | Descripción detallada |
| priority | IncidentPriority | ALTA / MEDIA / BAJA |
| status | IncidentStatus | Estado actual |
| fechaReporte | DateTime | Fecha de reporte |
| fechaAtencion | DateTime? | Fecha en que se atendió |
| fechaResolucion | DateTime? | Fecha de resolución |
| tiempoAtencionMinutos | Int? | Minutos hasta atención |
| tiempoResolucionMinutos | Int? | Minutos hasta resolución |
| cumpleSLA | Boolean? | ¿Cumplió el SLA? |
| categoria | String? | Categoría (Timbrado, Cancelación, etc.) |
| resolucion | Text? | Descripción de la resolución |

#### ReporteMensual
| Campo | Tipo | Descripción |
|-------|------|-------------|
| mes / anio | Int | Período del reporte |
| totalTimbrados | Int | CFDIs timbrados en el mes |
| totalCancelados | Int | CFDIs cancelados en el mes |
| totalErrores | Int | CFDIs con error en el mes |
| montoTotal | Float | Monto total facturado |
| timbresConsumidos / Disponibles | Int | Uso de timbres |
| incidentesAlta / Media / Baja | Int | Incidencias por prioridad |
| cumplimientoSLA | Float | % de cumplimiento SLA |

#### ConfiguracionPAC
| Campo | Tipo | Descripción |
|-------|------|-------------|
| nombre | String | Nombre del proveedor PAC |
| apiUrl / apiUrlSandbox | String | URLs de la API |
| apiKey / apiSecret | String | Credenciales de API |
| certificadoPEM / llavePrivadaPEM | Text? | Certificados CSD |
| passwordLlave | String? | Contraseña de llave privada |
| sandbox | Boolean | Modo sandbox activo |

---

## Features

### 1. Autenticación y Roles

**Ruta**: `/login`

- Login con email y contraseña (hashing bcrypt)
- Sesión JWT vía NextAuth v5 (sin base de datos de sesión)
- Botones de acceso rápido para usuarios demo
- Middleware protege todas las rutas excepto `/login` y `/api/auth`

**Roles**:

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total: CRUD, timbrar, cancelar, configurar, reportes |
| **OPERADOR** | Crear CFDIs, timbrar, cancelar, gestionar incidencias |
| **CONSULTOR** | Solo lectura: consultar CFDIs, reportes, incidencias |

**Flujo de autenticación**:
```
Login → NextAuth credentials → bcrypt.compare → JWT (id, role)
                                                      ↓
                                              Session enrichment
                                              (id, name, email, role)
```

---

### 2. Dashboard

**Ruta**: `/dashboard`
**API**: `GET /api/dashboard`

Pantalla principal con métricas en tiempo real:

- **KPIs principales**: Total timbrados, pendientes, cancelados, monto del mes
- **Barra de consumo de timbres**: Consumo actual vs capacidad anual (4,000,000)
- **Anillo de cumplimiento SLA**: Porcentaje de incidencias resueltas dentro del SLA
- **Estado del servicio PAC**: Indicador operativo/degradado/caído
- **Actividad reciente**: Últimos 5 CFDIs procesados
- **Incidencias abiertas**: Conteo de incidencias sin resolver

---

### 3. Gestión de CFDIs

#### Listado (`/cfdis`)
- Tabla paginada con todos los CFDIs
- **Filtros**: por estatus (PENDIENTE, TIMBRADO, CANCELADO, ERROR), por tipo (INGRESO, EGRESO, etc.)
- **Búsqueda**: por RFC de emisor o receptor
- **Badges de color** por estatus: verde (timbrado), amarillo (pendiente), rojo (cancelado/error)

#### Crear CFDI (`/cfdis/nuevo`)
- Selección de emisor y receptor (búsqueda en catálogo de contribuyentes)
- Tipo de comprobante, uso de CFDI, método y forma de pago
- **Conceptos dinámicos**: agregar/eliminar líneas de detalle
  - Clave producto/servicio SAT
  - Cantidad, unidad, descripción, precio unitario
  - Cálculo automático: importe = cantidad × precio unitario
  - IVA calculado por concepto (tasa configurable, default 16%)
- **Totales automáticos**: subtotal, IVA total, total general
- Validación de campos obligatorios

#### Detalle CFDI (`/cfdis/[id]`)
- Datos completos del emisor y receptor
- Tabla de conceptos con importes
- Desglose de totales (subtotal, impuestos, total)
- Datos de timbrado (UUID, fecha, sellos) si está timbrado
- **Acciones**:
  - Botón **Timbrar** (solo si estatus = PENDIENTE)
  - Botón **Cancelar** (solo si estatus = TIMBRADO)

---

### 4. Timbrado (PAC)

**API**: `POST /api/cfdis/[id]/timbrar`

Flujo de timbrado:
```
CFDI PENDIENTE → Llamada a PAC (timbrar) → Respuesta con UUID + sellos
                                                    ↓
                                          Actualiza CFDI:
                                          - status → TIMBRADO
                                          - uuid, fechaTimbrado
                                          - selloCFD, selloSAT
                                          - noCertificadoSAT
                                          - cadenaOriginal
                                          - xmlTimbrado
```

El cliente PAC (`src/lib/pac/client.ts`) actualmente es un **mock para sandbox** que genera datos simulados. En producción se integra con el PAC autorizado real.

**Datos generados por el PAC**:
- UUID fiscal v4
- Sello del CFD (base64)
- Sello del SAT (base64)
- Número de certificado SAT
- Cadena original del timbre
- XML del Timbre Fiscal Digital

---

### 5. Cancelación

**API**: `POST /api/cfdis/[id]/cancelar`

Flujo de cancelación:
```
CFDI TIMBRADO → Modal: seleccionar motivo → Llamada a PAC (cancelar)
                                                      ↓
                                            Actualiza CFDI:
                                            - status → CANCELADO
                                            - fechaCancelacion
                                            - motivoCancelacion
                                            - folioSustitucion (si aplica)
```

**Motivos de cancelación** (catálogo SAT):
- `01` — Comprobante emitido con errores con relación
- `02` — Comprobante emitido con errores sin relación
- `03` — No se llevó a cabo la operación
- `04` — Operación nominativa relacionada en una factura global

---

### 6. Contribuyentes

**Rutas**: `/contribuyentes`, `/contribuyentes/nuevo`
**API**: `/api/contribuyentes`, `/api/contribuyentes/[id]`

Catálogo centralizado de emisores y receptores:

- **Listado** con búsqueda por RFC o razón social
- **Registro**: RFC (único), razón social, régimen fiscal, código postal, email, teléfono
- **Edición y eliminación**
- RFC normalizado a mayúsculas
- Regímenes fiscales del catálogo SAT (601–626)

---

### 7. Incidencias y SLA

**Rutas**: `/incidencias`, `/incidencias/nueva`
**API**: `/api/incidencias`, `/api/incidencias/[id]`

Sistema de seguimiento de incidencias con acuerdos de nivel de servicio (SLA):

#### Matriz SLA

| Prioridad | Descripción | Tiempo de Atención | Tiempo de Solución |
|-----------|-------------|--------------------|--------------------|
| **ALTA** | Servicio crítico | 0.5 horas (30 min) | 1.0 horas (60 min) |
| **MEDIA** | Afecta a muchos usuarios | 2.0 horas (120 min) | 4.0 horas (240 min) |
| **BAJA** | Usuario único / No urgente | 5.0 horas (300 min) | 10.0 horas (600 min) |

#### Flujo de estados

```
ABIERTO → EN_ATENCION → RESUELTO → CERRADO
             ↑               ↑
        registra          registra
      fechaAtencion    fechaResolucion
      tiempoAtencion   tiempoResolucion
                        cumpleSLA ✓/✗
```

#### Cálculo automático de SLA

Cuando una incidencia cambia a **EN_ATENCION**:
- Se registra `fechaAtencion = now()`
- Se calcula `tiempoAtencionMinutos = diff(fechaAtencion - fechaReporte)`

Cuando cambia a **RESUELTO**:
- Se registra `fechaResolucion = now()`
- Se calcula `tiempoResolucionMinutos = diff(fechaResolucion - fechaReporte)`
- Se evalúa `cumpleSLA`:
  - `atencionOk = tiempoAtencion <= límiteAtención[prioridad]`
  - `resolucionOk = tiempoResolucion <= límiteResolución[prioridad]`
  - `cumpleSLA = atencionOk AND resolucionOk`

**Implementación**: `src/app/api/incidencias/[id]/route.ts` líneas 6-9

```typescript
const SLA_LIMITS = {
  ALTA:  { atencion: 30,  resolucion: 60  },
  MEDIA: { atencion: 120, resolucion: 240 },
  BAJA:  { atencion: 300, resolucion: 600 },
}
```

#### Categorías de incidencias
- Timbrado
- Cancelación
- Validación
- Conectividad
- Certificados
- Otro

---

### 8. Reportes Mensuales

**Ruta**: `/reportes`
**API**: `GET /api/reportes`, `GET /api/reportes?mes=X&anio=Y&generate=true`

Generación de reportes estadísticos mensuales:

- Seleccionar mes y año → click "Generar Reporte"
- El API agrega datos del período seleccionado:
  - Total de CFDIs timbrados, cancelados, con error
  - Monto total facturado
  - Timbres consumidos vs disponibles
  - Incidencias por prioridad (alta, media, baja)
  - Porcentaje de cumplimiento SLA
- Si ya existe un reporte para ese mes, se actualiza (upsert)
- Tabla histórica con los últimos 12 reportes

---

### 9. Configuración PAC

**Ruta**: `/configuracion`

Configuración del proveedor PAC (Proveedor Autorizado de Certificación):

- **Datos del PAC**: Nombre, URL producción, URL sandbox, API key, API secret
- **Certificados CSD**: Carga de certificado PEM y llave privada PEM, contraseña
- **Modo sandbox**: Toggle para ambiente de pruebas vs producción
- **Validaciones SAT**: Información sobre cumplimiento Anexo 20 (LRFC, LCO, EFOS/EDOS)

---

## API Reference

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth handlers (signin, signout, session) |

### CFDIs
| Método | Ruta | Descripción | Params |
|--------|------|-------------|--------|
| GET | `/api/cfdis` | Listar CFDIs | `?status=TIMBRADO&tipo=INGRESO&search=RFC&page=1&limit=20` |
| POST | `/api/cfdis` | Crear CFDI | Body: emisorId, receptorId, tipo, conceptos[], etc. |
| GET | `/api/cfdis/[id]` | Detalle de CFDI | — |
| DELETE | `/api/cfdis/[id]` | Eliminar CFDI (solo PENDIENTE) | — |
| POST | `/api/cfdis/[id]/timbrar` | Timbrar CFDI con PAC | — |
| POST | `/api/cfdis/[id]/cancelar` | Cancelar CFDI | Body: `{ motivo, folioSustitucion? }` |

### Contribuyentes
| Método | Ruta | Descripción | Params |
|--------|------|-------------|--------|
| GET | `/api/contribuyentes` | Listar contribuyentes | `?search=texto&limit=50` |
| POST | `/api/contribuyentes` | Crear contribuyente | Body: rfc, razonSocial, regimenFiscal, etc. |
| GET | `/api/contribuyentes/[id]` | Detalle | — |
| PUT | `/api/contribuyentes/[id]` | Actualizar | Body: campos a actualizar |
| DELETE | `/api/contribuyentes/[id]` | Eliminar | — |

### Incidencias
| Método | Ruta | Descripción | Params |
|--------|------|-------------|--------|
| GET | `/api/incidencias` | Listar incidencias | `?status=ABIERTO` |
| POST | `/api/incidencias` | Crear incidencia | Body: titulo, descripcion, priority, categoria |
| GET | `/api/incidencias/[id]` | Detalle | — |
| PATCH | `/api/incidencias/[id]` | Actualizar (calcula SLA) | Body: `{ status, resolucion? }` |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard` | KPIs: totales, montos, SLA, timbres, actividad reciente |

### Reportes
| Método | Ruta | Descripción | Params |
|--------|------|-------------|--------|
| GET | `/api/reportes` | Listar reportes | `?limit=12` |
| GET | `/api/reportes` | Generar reporte | `?mes=3&anio=2026&generate=true` |

---

## Componentes UI

Todos los componentes están en `src/components/ui/` y son reutilizables:

| Componente | Props principales | Descripción |
|------------|-------------------|-------------|
| `Button` | variant (primary/secondary/danger/ghost), size (sm/md/lg), loading | Botón con estados |
| `Card` | — | Contenedor con CardHeader, CardTitle, CardContent, CardFooter |
| `Badge` | variant (success/error/warning/info/default) | Indicador de estado |
| `Input` | label, error, + todos los HTMLInputElement props | Input con label y validación |
| `Select` | label, error, children | Select con label y validación |
| `Modal` | open, onClose, title | Modal controlado con overlay |
| `Table` | — | Table, TableHeader, TableBody, TableRow, TableHead, TableCell |
| `StatCard` | icon, title, value, color | Tarjeta KPI para dashboard |

**Layout Components**:

| Componente | Descripción |
|------------|-------------|
| `DashboardLayout` | Layout principal con sidebar colapsable y topbar |
| `Sidebar` | Menú de navegación con iconos, estado activo, logout |
| `Topbar` | Barra superior para mobile con toggle de menú |

---

## Instalación y Setup

### Prerrequisitos
- Node.js 18+
- PostgreSQL 15+

### Pasos

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd facturacion-electronica

# 2. Instalar dependencias
npm install

# 3. Crear base de datos PostgreSQL
createdb facturacion_electronica

# 4. Configurar variables de entorno
# Crear/editar .env.local con:
DATABASE_URL=postgresql://usuario@localhost:5432/facturacion_electronica
AUTH_SECRET=tu-secret-key-aqui

# 5. Ejecutar migraciones
npx prisma migrate dev --name init

# 6. Generar cliente Prisma
npm run db:generate

# 7. Cargar datos de demostración
npm run db:seed

# 8. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `npm run dev` | Servidor de desarrollo |
| `build` | `npm run build` | Build de producción |
| `start` | `npm run start` | Servidor de producción |
| `lint` | `npm run lint` | Linter ESLint |
| `db:generate` | `npm run db:generate` | Generar cliente Prisma |
| `db:migrate` | `npm run db:migrate` | Ejecutar migraciones |
| `db:seed` | `npm run db:seed` | Cargar datos demo |
| `db:studio` | `npm run db:studio` | Abrir Prisma Studio |

---

## Datos de Demostración

### Usuarios

| Email | Contraseña | Rol | Nombre |
|-------|-----------|-----|--------|
| admin@shp.gob.mx | admin123 | ADMIN | Carlos Admin |
| operador@shp.gob.mx | operador123 | OPERADOR | María Operadora |
| operador2@shp.gob.mx | operador123 | OPERADOR | Juan Operador |
| consultor@shp.gob.mx | operador123 | CONSULTOR | Ana Consultora |

### Datos sembrados
- **15 contribuyentes**: Gobierno del Estado, Público en General, empresas de construcción, farmacéuticas, consultorías, etc.
- **62 CFDIs**: Distribuidos en enero–marzo 2026 (70% timbrados, 10% cancelados, 10% pendientes, 10% error)
- **13 incidencias**: Mix de prioridades y estados, con categorías variadas
- **5 reportes mensuales**: Octubre 2025 – Febrero 2026
- **1 configuración PAC**: Proveedor demo en modo sandbox

---

## Cumplimiento SAT

El sistema está diseñado para cumplir con los requerimientos del SAT para facturación electrónica:

- **Anexo 20**: Estructura XML CFDI 4.0
- **Catálogos SAT**: Uso CFDI, régimen fiscal, forma/método de pago, claves producto/servicio, claves unidad
- **Validaciones**: RFC (LRFC), Lista de Contribuyentes Obligados (LCO), EFOS/EDOS
- **Timbrado**: Integración con PAC autorizado para sellado fiscal
- **Cancelación**: Con motivos del catálogo SAT y folio de sustitución
- **Volumen**: Diseñado para manejar hasta 4,000,000 de timbres anuales
