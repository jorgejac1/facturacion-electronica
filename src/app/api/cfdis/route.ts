import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const tipo = searchParams.get('tipo')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (tipo) where.tipo = tipo
  if (search) {
    where.OR = [
      { uuid: { contains: search, mode: 'insensitive' } },
      { emisor: { rfc: { contains: search, mode: 'insensitive' } } },
      { emisor: { razonSocial: { contains: search, mode: 'insensitive' } } },
      { receptor: { rfc: { contains: search, mode: 'insensitive' } } },
      { receptor: { razonSocial: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [cfdis, total] = await Promise.all([
    prisma.cfdi.findMany({
      where,
      include: {
        emisor: { select: { rfc: true, razonSocial: true } },
        receptor: { select: { rfc: true, razonSocial: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cfdi.count({ where }),
  ])

  return NextResponse.json({
    cfdis,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { emisorId, receptorId, conceptos, ...cfdiData } = body

  const cfdi = await prisma.cfdi.create({
    data: {
      ...cfdiData,
      emisorId,
      receptorId,
      createdById: session.user.id,
      conceptos: {
        create: conceptos.map((c: Record<string, unknown>) => ({
          claveProdServ: c.claveProdServ,
          cantidad: c.cantidad,
          claveUnidad: c.claveUnidad,
          unidad: c.unidad,
          descripcion: c.descripcion,
          valorUnitario: c.valorUnitario,
          importe: c.importe,
          tasaIVA: c.tasaIVA,
          importeIVA: c.importeIVA,
        })),
      },
    },
    include: {
      emisor: true,
      receptor: true,
      conceptos: true,
    },
  })

  return NextResponse.json(cfdi, { status: 201 })
}
