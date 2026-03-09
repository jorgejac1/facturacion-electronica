import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const incidents = await prisma.incident.findMany({
    where,
    include: {
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ incidents })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  const incident = await prisma.incident.create({
    data: {
      titulo: body.titulo,
      descripcion: body.descripcion,
      priority: body.priority,
      categoria: body.categoria,
      createdById: session.user.id,
    },
  })

  return NextResponse.json(incident, { status: 201 })
}
