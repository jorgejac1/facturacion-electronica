import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { rfc: { contains: search, mode: 'insensitive' } },
      { razonSocial: { contains: search, mode: 'insensitive' } },
    ]
  }

  const contribuyentes = await prisma.contribuyente.findMany({
    where,
    orderBy: { razonSocial: 'asc' },
    take: limit,
  })

  return NextResponse.json({ contribuyentes })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  const existing = await prisma.contribuyente.findUnique({
    where: { rfc: body.rfc },
  })
  if (existing) {
    return NextResponse.json({ error: 'El RFC ya existe' }, { status: 400 })
  }

  const contribuyente = await prisma.contribuyente.create({ data: body })
  return NextResponse.json(contribuyente, { status: 201 })
}
