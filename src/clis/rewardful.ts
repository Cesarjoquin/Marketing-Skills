// @ts-nocheck
/** rewardful CLI — migrated from tools/clis/rewardful.js */
let _dryRun = false;

const API_KEY = process.env.REWARDFUL_API_KEY
const BASE_URL = 'https://api.getrewardful.com/v1'



async function api(method, path, body) {
  const auth = 'Basic ' + Buffer.from(`${API_KEY}:`).toString('base64')
  if (_dryRun) {
    return { _dry_run: true, method, url: `${BASE_URL}${path}`, headers: { Authorization: '***', 'Content-Type': 'application/json' }, body: body || undefined }
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { status: res.status, body: text }
  }
}



export async function run(args) {
  _dryRun = args['dry-run'] === true;
  if (!API_KEY) throw new Error('REWARDFUL_API_KEY environment variable required');
  const [cmd, sub] = args._;
  let result

  switch (cmd) {
    case 'affiliates':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.page) params.set('page', args.page)
          result = await api('GET', `/affiliates?${params}`)
          break
        }
        case 'get':
          if (!rest[0]) { result = { error: 'Affiliate ID required' }; break }
          result = await api('GET', `/affiliates/${rest[0]}`)
          break
        case 'search': {
          const params = new URLSearchParams()
          if (args.email) params.set('email', args.email)
          result = await api('GET', `/affiliates?${params}`)
          break
        }
        case 'update': {
          if (!rest[0]) { result = { error: 'Affiliate ID required' }; break }
          const body = {}
          if (args['first-name']) body.first_name = args['first-name']
          if (args['last-name']) body.last_name = args['last-name']
          if (args['paypal-email']) body.paypal_email = args['paypal-email']
          result = await api('PUT', `/affiliates/${args.id}`, body)
          break
        }
        default:
          result = { error: 'Unknown affiliates subcommand. Use: list, get, search, update' }
      }
      break

    case 'referrals':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args['affiliate-id']) params.set('affiliate_id', args['affiliate-id'])
          result = await api('GET', `/referrals?${params}`)
          break
        }
        case 'get': {
          const params = new URLSearchParams()
          if (args['stripe-customer-id']) params.set('stripe_customer_id', args['stripe-customer-id'])
          result = await api('GET', `/referrals?${params}`)
          break
        }
        default:
          result = { error: 'Unknown referrals subcommand. Use: list, get' }
      }
      break

    case 'commissions':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args['affiliate-id']) params.set('affiliate_id', args['affiliate-id'])
          result = await api('GET', `/commissions?${params}`)
          break
        }
        case 'get':
          if (!rest[0]) { result = { error: 'Commission ID required' }; break }
          result = await api('GET', `/commissions/${rest[0]}`)
          break
        default:
          result = { error: 'Unknown commissions subcommand. Use: list, get' }
      }
      break

    case 'links':
      switch (sub) {
        case 'create': {
          if (!args['affiliate-id']) { result = { error: '--affiliate-id required' }; break }
          const body = {}
          if (args.token) body.token = args.token
          if (args.url) body.url = args.url
          result = await api('POST', `/affiliates/${args['affiliate-id']}/links`, body)
          break
        }
        default:
          result = { error: 'Unknown links subcommand. Use: create' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          affiliates: 'affiliates [list|get|search|update] [id] [--email <email>] [--id <id>] [--first-name <name>] [--last-name <name>] [--paypal-email <email>]',
          referrals: 'referrals [list|get] [--affiliate-id <id>] [--stripe-customer-id <id>]',
          commissions: 'commissions [list|get] [id] [--affiliate-id <id>]',
          links: 'links [create] [--affiliate-id <id>] [--token <token>] [--url <url>]',
        }
      }
  }
  return result;
}
