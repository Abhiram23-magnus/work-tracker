import type { Paise } from '../types/worker'

/**
 * Converts a rupee amount (number or user-typed string) to integer paise.
 * Returns NaN for anything that isn't a plain amount with at most 2 decimals, so validation can reject it.
 */
export function rupeesToPaise(rupees: number | string): Paise {
  if (typeof rupees === 'string') {
    const text = rupees.trim().replace(/,/g, '')
    if (!/^-?\d+(\.\d{1,2})?$|^-?\.\d{1,2}$/.test(text)) return NaN
    return Math.round(Number(text) * 100)
  }
  return Number.isFinite(rupees) ? Math.round(rupees * 100) : NaN
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

/** For form fields: an empty box counts as ₹0 ("enter an amount"), anything unreadable as NaN ("enter a number"). */
export function parseRupeeInput(text: string): Paise {
  return text.trim() === '' ? 0 : rupeesToPaise(text)
}
