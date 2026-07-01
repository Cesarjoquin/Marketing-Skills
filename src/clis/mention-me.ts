// @ts-nocheck
/** mention-me CLI — migrated from tools/clis/mention-me.js */
let _dryRun = false;

const API_KEY = process.env.MENTIONME_API_KEY
const BASE_URL = 'https://api.mention-me.com/api/v2'



async function api(method, path, body) {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  }
  if (_dryRun) {
    return { _dry_run: true, method, url: `${BASE_URL}${path}`, headers: { ...headers, Authorization: '***' }, body: body || undefined }
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
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
  if (!API_KEY) throw new Error('MENTIONME_API_KEY environment variable required');
  const [cmd, sub] = args._;
  let result

  switch (cmd) {
    case 'offers':
      switch (sub) {
        case 'create': {
          const body = {}
          if (args.email) body.email = args.email
          if (args.firstname) body.firstname = args.firstname
          if (args.lastname) body.lastname = args.lastname
          if (args['order-number']) body.order_number = args['order-number']
          if (args['order-total']) body.order_total = Number(args['order-total'])
          if (args['order-currency']) body.order_currency = args['order-currency']
          result = await api('POST', '/referrer-offer', body)
          break
        }
        default:
          result = { error: 'Unknown offers subcommand. Use: create' }
      }
      break

    case 'referrals':
      switch (sub) {
        case 'get': {
          const refId = rest[0] || args.id
          if (!refId) { result = { error: 'Referral ID required (positional arg or --id)' }; break }
          result = await api('GET', `/referral/${refId}`)
          break
        }
        case 'list': {
          if (!args['customer-id']) { result = { error: '--customer-id required' }; break }
          result = await api('GET', `/referrer/${args['customer-id']}/referrals`)
          break
        }
        default:
          result = { error: 'Unknown referrals subcommand. Use: get, list' }
      }
      break

    case 'share-links':
      switch (sub) {
        case 'get':
          if (!args['customer-id']) { result = { error: '--customer-id required' }; break }
          result = await api('GET', `/referrer/${args['customer-id']}/share-links`)
          break
        default:
          result = { error: 'Unknown share-links subcommand. Use: get' }
      }
      break

    case 'rewards':
      switch (sub) {
        case 'get':
          if (!args['customer-id']) { result = { error: '--customer-id required' }; break }
          result = await api('GET', `/referrer/${args['customer-id']}/rewards`)
          break
        case 'redeem': {
          if (!args['customer-id']) { result = { error: '--customer-id required' }; break }
          const body = {}
          if (args['reward-id']) body.reward_id = args['reward-id']
          if (args['order-number']) body.order_number = args['order-number']
          result = await api('POST', `/referrer/${args['customer-id']}/rewards/redeem`, body)
          break
        }
        default:
          result = { error: 'Unknown rewards subcommand. Use: get, redeem' }
      }
      break

    case 'referee':
      switch (sub) {
        case 'create': {
          const body = {}
          if (args.email) body.email = args.email
          if (args.firstname) body.firstname = args.firstname
          if (args['referrer-code']) body.referrer_code = args['referrer-code']
          if (args['order-number']) body.order_number = args['order-number']
          if (args['order-total']) body.order_total = Number(args['order-total'])
          result = await api('POST', '/referee', body)
          break
        }
        default:
          result = { error: 'Unknown referee subcommand. Use: create' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          offers: 'offers [create] [--email <email>] [--firstname <name>] [--lastname <name>] [--order-number <num>] [--order-total <total>] [--order-currency <currency>]',
          referrals: 'referrals [get|list] [id] [--customer-id <id>]',
          'share-links': 'share-links [get] [--customer-id <id>]',
          rewards: 'rewards [get|redeem] [--customer-id <id>] [--reward-id <id>] [--order-number <num>]',
          referee: 'referee [create] [--email <email>] [--firstname <name>] [--referrer-code <code>] [--order-number <num>] [--order-total <total>]',
        }
      }
  }
  return result;
}
