import { NextResponse } from 'next/server'
import { getProviderInfo } from '@/lib/pac/client'

export async function GET() {
  const info = getProviderInfo()
  return NextResponse.json(info)
}
