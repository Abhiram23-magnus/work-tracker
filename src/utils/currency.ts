import type { Paise } from '../types/worker'

/** Converts a rupee amount (number or user-typed string) to integer paise. Returns NaN if it isn't a number. */
export function rupeesToPaise(rupees: number | string): Paise {
  const value = typeof rupees === 'string' ? Number(rupees.trim().replace(/,/g, '')) : rupees
  if (typeof rupees === 'string' && rupees.trim() === '') return NaN
  return Number.isFinite(value) ? Math.round(value * 100) : NaN
}

export function paiseToRupees(paise: Paise): number {
  return paise / 100
}

const wholeRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const withPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })

/** Formats paise as rupees, keeping the sign: -50000 → "-₹500", 20050 → "₹200.50". */
export function formatPaise(paise: Paise): string {
  return (paise % 100 === 0 ? wholeRupees : withPaise).format(paise / 100)
}
