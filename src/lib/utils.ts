export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function formatRFC(rfc: string): string {
  return rfc.toUpperCase().trim()
}

export function generateFolio(serie: string, consecutivo: number): string {
  return `${serie}-${consecutivo.toString().padStart(6, '0')}`
}

export function calcularIVA(subtotal: number, tasa: number = 0.16): number {
  return Math.round(subtotal * tasa * 100) / 100
}
