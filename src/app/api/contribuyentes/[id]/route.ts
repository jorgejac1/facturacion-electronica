import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const contribuyente = await prisma.contribuyente.findUnique({ where: { id } })
  if (!contribuyente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json(contribuyente)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const contribuyente = await prisma.contribuyente.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(contribuyente)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.contribuyente.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
