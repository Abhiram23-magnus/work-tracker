import type { BrowserContext, Route } from '@playwright/test'

/**
 * In-memory stand-in for Supabase Auth (phone OTP) and the tracker_items REST table, shared by every
 * browser context in a test so contexts behave like separate phones. It applies the same rules as
 * the real RLS policies (user_id = auth.uid()) so app-level isolation can be checked without network
 * access. The real policies are tested separately by tests/rls/tracker_items_rls.sql and live.e2e.ts.
 */
export const VALID_CODE = '246810'
export const EXPIRED_CODE = '135790'

interface User { id: string; phone: string }
interface Row { user_id: string; collection: string; id: string; data: unknown; deleted: boolean; updated_at: string }

export interface Device {
  name: string
  offline: boolean
  /** Makes the next request to this path fail as if the connection dropped. */
  failNextRequestTo?: string
}

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }

export class FakeSupabase {
  users = new Map<string, User>()
  rows = new Map<string, Row>()
  tokens = new Map<string, User>()
  otpRequests: { device: string; phone: string; at: number }[] = []
  private clock = Date.now()

  /** smsRateLimit: refuse a second SMS to the same number within 60 s, like Supabase does. */
  constructor(private options: { smsRateLimit?: boolean } = { smsRateLimit: true }) {}

  private now() {
    return new Date(++this.clock).toISOString()
  }

  private issue(user: User) {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const access = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp, phone: user.phone })}.fake${Math.random().toString(36).slice(2)}`
    this.tokens.set(access, user)
    return {
      access_token: access,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: exp,
      refresh_token: `r${Math.random()}`,
      user: {
        id: user.id, aud: 'authenticated', role: 'authenticated', phone: user.phone,
        phone_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'phone' }, user_metadata: {},
        identities: [], created_at: new Date().toISOString(),
      },
    }
  }

  user(phoneDigits: string) {
    return this.users.get(phoneDigits)
  }

  rowsFor(userId: string) {
    return [...this.rows.values()].filter((r) => r.user_id === userId && !r.deleted)
  }

  async attach(context: BrowserContext, name: string): Promise<Device> {
    const device: Device = { name, offline: false }
    await context.route('https://*.supabase.co/**', (route) => this.handle(route, device))
    return device
  }

  private json(route: Route, status: number, body?: unknown) {
    return route.fulfill({ status, contentType: 'application/json', headers: CORS, body: body === undefined ? '' : JSON.stringify(body) })
  }

  private async handle(route: Route, device: Device) {
    const req = route.request()
    if (device.offline) return route.abort('internetdisconnected')
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: CORS })
    const url = new URL(req.url())
    if (device.failNextRequestTo === url.pathname) {
      device.failNextRequestTo = undefined
      return route.abort('internetdisconnected')
    }
    const body = req.postData() ? JSON.parse(req.postData()!) : undefined
    const me = this.tokens.get((req.headers()['authorization'] ?? '').replace(/^Bearer /, ''))

    switch (url.pathname) {
      case '/auth/v1/otp': {
        if (!/^\+?\d{8,15}$/.test(body.phone)) return this.json(route, 400, { code: 'validation_failed', msg: 'Invalid phone number format' })
        // Like Supabase: at most one SMS per number per 60 s.
        const last = [...this.otpRequests].reverse().find((r) => r.phone === body.phone)
        if (this.options.smsRateLimit && last && Date.now() - last.at < 60_000) {
          this.otpRequests.push({ device: device.name, phone: body.phone, at: Date.now() })
          return this.json(route, 429, { code: 'over_sms_send_rate_limit', msg: 'For security purposes, you can only request this after 60 seconds.' })
        }
        this.otpRequests.push({ device: device.name, phone: body.phone, at: Date.now() })
        return this.json(route, 200, {})
      }
      case '/auth/v1/verify': {
        if (body.token !== VALID_CODE) {
          // Supabase answers wrong and expired codes with the same error.
          return this.json(route, 403, { code: 'otp_expired', error_code: 'otp_expired', msg: 'Token has expired or is invalid' })
        }
        const digits = String(body.phone).replace('+', '')
        if (!this.users.has(digits)) this.users.set(digits, { id: crypto.randomUUID(), phone: digits })
        return this.json(route, 200, this.issue(this.users.get(digits)!))
      }
      case '/auth/v1/logout':
        return route.fulfill({ status: 204, headers: CORS })
      case '/auth/v1/user':
        return me ? this.json(route, 200, this.issue(me).user) : this.json(route, 401, { code: 'bad_jwt', msg: 'invalid JWT' })
      case '/rest/v1/tracker_items': {
        if (!me) return this.json(route, 401, { code: 'PGRST301', message: 'JWT invalid' })
        if (req.method() === 'POST') {
          if ((body as Row[]).some((r) => r.user_id !== me.id)) {
            return this.json(route, 403, { code: '42501', message: 'new row violates row-level security policy for table "tracker_items"' })
          }
          for (const r of body as Row[]) this.rows.set(`${r.user_id}|${r.collection}|${r.id}`, { ...r, updated_at: this.now() })
          return route.fulfill({ status: 201, headers: CORS })
        }
        const gt = (url.searchParams.get('updated_at') ?? 'gt.1970').slice(3)
        const limit = Number(url.searchParams.get('limit') ?? 1000)
        const list = [...this.rows.values()]
          .filter((r) => r.user_id === me.id && r.updated_at > gt)
          .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
          .slice(0, limit)
          .map(({ collection, id, data, deleted, updated_at }) => ({ collection, id, data, deleted, updated_at }))
        return this.json(route, 200, list)
      }
    }
    return this.json(route, 404, { message: `not faked: ${url.pathname}` })
  }
}
