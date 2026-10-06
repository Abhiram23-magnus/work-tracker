import { ACCOUNT_STATUS_LABELS, type AccountStatus } from '../../domain/accountStatus'

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return <span className={`status-badge status-badge-${status}`}>{ACCOUNT_STATUS_LABELS[status]}</span>
}
