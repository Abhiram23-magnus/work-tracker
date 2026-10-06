import type { Paise } from '../types/worker'

export type AccountStatus = 'pending-to-pay' | 'cleared' | 'advance-to-recover'

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  'pending-to-pay': 'Pending to Pay',
  cleared: 'Cleared',
  'advance-to-recover': 'Advance to Recover',
}

/** balance > 0: farmer owes the worker; 0: settled; < 0: worker must work off the advance. */
export function accountStatusFor(balance: Paise): AccountStatus {
  if (balance > 0) return 'pending-to-pay'
  if (balance < 0) return 'advance-to-recover'
  return 'cleared'
}
