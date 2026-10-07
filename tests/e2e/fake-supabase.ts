import type { BrowserContext, Route } from '@playwright/test'

/**
 * In-memory stand-in for Supabase Auth (email + password) and the tracker_items REST table, shared by every
 * browser context in a test so contexts behave like separate phones. It applies the same rules as
 * the real RLS policies (user_id = auth.uid()) so app-level isolation can be checked without network
 * access. The real policies are tested separately by tests/rls/tracker_items_rls.sql and live.e2e.ts.
 */
export const PASSWORD = 'farm-pass-123'

interface User { id: string; email: string; password: string; confirmed: boolean }
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
  authRequests: { device: string; path: string }[] = []
  private clock = Date.now()

  /** confirmEmail: new accounts must confirm their email before signing in (Supabase's default). */
  constructor(private options: { confirmEmail?: boolean } = {}) {}

  /** Marks an account as confirmed, as if the person clicked the link in the email. */
  confirm(email: string) {
    this.users.get(email)!.confirmed = true
  }

  private now() {
    return new Date(++this.clock).toISOString()
  }

  private issue(user: User) {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const access = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp, email: user.email })}.fake${Math.random().toString(36).slice(2)}`
    this.tokens.set(access, user)
    return {
      access_token: access,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: exp,
      refresh_token: `r${Math.random()}`,
      user: {
        id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email,
        email_confirmed_at: user.confirmed ? new Date().toISOString() : null, app_metadata: { provider: 'email' }, user_metadata: {},
        identities: [], created_at: new Date().toISOString(),
      },
    }
  }

  user(email: string) {
    return this.users.get(email)
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
      case '/auth/v1/signup': {
        this.authRequests.push({ device: device.name, path: url.pathname })
        const email = String(body.email)
        if (this.users.has(email)) return this.json(route, 422, { code: 'user_already_exists', msg: 'User already registered' })
        const user: User = { id: crypto.randomUUID(), email, password: body.password, confirmed: !this.options.confirmEmail }
        this.users.set(email, user)
        // With confirmation on, Supabase returns the user but no session.
        return this.json(route, 200, user.confirmed ? this.issue(user) : this.issue(user).user)
      }
      case '/auth/v1/token': {
        this.authRequests.push({ device: device.name, path: url.pathname })
        const user = this.users.get(String(body.email))
        if (!user || user.password !== body.password) {
          return this.json(route, 400, { code: 'invalid_credentials', error_code: 'invalid_credentials', msg: 'Invalid login credentials' })
        }
        if (!user.confirmed) return this.json(route, 400, { code: 'email_not_confirmed', msg: 'Email not confirmed' })
        return this.json(route, 200, this.issue(user))
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
