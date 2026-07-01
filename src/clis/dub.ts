// @ts-nocheck
/** dub CLI — migrated from tools/clis/dub.js */
let _dryRun = false;

const API_KEY = process.env.DUB_API_KEY
const BASE_URL = 'https://api.dub.co'



async function api(method, path, body) {
  if (_dryRun) {
    return { _dry_run: true, method, url: `${BASE_URL}${path}`, headers: { Authorization: '***', 'Content-Type': 'application/json' }, body: body || undefined }
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
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
  if (!API_KEY) throw new Error('DUB_API_KEY environment variable required');
  const [cmd, sub] = args._;
  let result

  switch (cmd) {
    case 'links':
      switch (sub) {
        case 'create': {
          if (!args.url) { result = { error: '--url required' }; break }
          const body = {}
          if (args.url) body.url = args.url
          if (args.domain) body.domain = args.domain
          if (args.key) body.key = args.key
          if (args.tags) body.tags = args.tags.split(',')
          result = await api('POST', '/links', body)
          break
        }
        case 'list': {
          const params = new URLSearchParams()
          if (args.domain) params.set('domain', args.domain)
          if (args.page) params.set('page', args.page)
          result = await api('GET', `/links?${params}`)
          break
        }
        case 'get': {
          const params = new URLSearchParams()
          if (args.domain) params.set('domain', args.domain)
          if (args.key) params.set('key', args.key)
          if (args['link-id']) params.set('linkId', args['link-id'])
          if (args['external-id']) params.set('externalId', args['external-id'])
          result = await api('GET', `/links/info?${params}`)
          break
        }
        case 'update': {
          if (!args.id) { result = { error: '--id required (link ID)' }; break }
          const body = {}
          if (args.url) body.url = args.url
          if (args.tags) body.tags = args.tags.split(',')
          result = await api('PATCH', `/links/${args.id}`, body)
          break
        }
        case 'delete':
          if (!args.id) { result = { error: '--id required (link ID)' }; break }
          result = await api('DELETE', `/links/${args.id}`)
          break
        case 'bulk-create': {
          let links
          try {
            links = JSON.parse(args.links || '[]')
          } catch {
            result = { error: 'Invalid JSON in --links' }; break
          }
          result = await api('POST', '/links/bulk', links)
          break
        }
        default:
          result = { error: 'Unknown links subcommand. Use: create, list, get, update, delete, bulk-create' }
      }
      break

    case 'analytics':
      switch (sub) {
        case 'get': {
          const params = new URLSearchParams()
          if (args.domain) params.set('domain', args.domain)
          if (args.key) params.set('key', args.key)
          if (args.interval) params.set('interval', args.interval)
          result = await api('GET', `/analytics?${params}`)
          break
        }
        case 'country': {
          const params = new URLSearchParams()
          if (args.domain) params.set('domain', args.domain)
          if (args.key) params.set('key', args.key)
          result = await api('GET', `/analytics/country?${params}`)
          break
        }
        case 'device': {
          const params = new URLSearchParams()
          if (args.domain) params.set('domain', args.domain)
          if (args.key) params.set('key', args.key)
          result = await api('GET', `/analytics/device?${params}`)
          break
        }
        default:
          result = { error: 'Unknown analytics subcommand. Use: get, country, device' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          links: 'links [create|list|get|update|delete|bulk-create] [--url <url>] [--domain <domain>] [--key <key>] [--tags <tags>] [--id <id>] [--page <page>] [--links <json>]',
          analytics: 'analytics [get|country|device] [--domain <domain>] [--key <key>] [--interval <interval>]',
        }
      }
  }
  return result;
}
