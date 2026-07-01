// @ts-nocheck
/** ahrefs CLI — migrated from tools/clis/ahrefs.js */
let _dryRun = false;

const API_KEY = process.env.AHREFS_API_KEY
const BASE_URL = 'https://api.ahrefs.com/v3'



async function api(method, path) {
  if (_dryRun) {
    return { _dry_run: true, method, url: `${BASE_URL}${path}`, headers: { 'Authorization': '***', 'Content-Type': 'application/json' } }
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
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
  if (!API_KEY) throw new Error('AHREFS_API_KEY environment variable required');
  const [cmd, sub] = args._;
  let result
  const mode = args.mode || 'domain'

  switch (cmd) {
    case 'domain-rating':
      switch (sub) {
        case 'get': {
          if (!args.target) { result = { error: '--target required (domain)' }; break }
          const params = new URLSearchParams({ target: args.target })
          result = await api('GET', `/site-explorer/domain-rating?${params}`)
          break
        }
        default:
          result = { error: 'Unknown domain-rating subcommand. Use: get' }
      }
      break

    case 'backlinks':
      switch (sub) {
        case 'list': {
          if (!args.target) { result = { error: '--target required (domain or URL)' }; break }
          const params = new URLSearchParams({ target: args.target, mode })
          if (args.limit) params.set('limit', args.limit)
          result = await api('GET', `/site-explorer/backlinks?${params}`)
          break
        }
        default:
          result = { error: 'Unknown backlinks subcommand. Use: list' }
      }
      break

    case 'refdomains':
      switch (sub) {
        case 'list': {
          if (!args.target) { result = { error: '--target required (domain or URL)' }; break }
          const params = new URLSearchParams({ target: args.target, mode })
          if (args.limit) params.set('limit', args.limit)
          result = await api('GET', `/site-explorer/refdomains?${params}`)
          break
        }
        default:
          result = { error: 'Unknown refdomains subcommand. Use: list' }
      }
      break

    case 'keywords':
      switch (sub) {
        case 'organic': {
          if (!args.target) { result = { error: '--target required (domain or URL)' }; break }
          const params = new URLSearchParams({ target: args.target, mode })
          if (args.country) params.set('country', args.country)
          if (args.limit) params.set('limit', args.limit)
          result = await api('GET', `/site-explorer/organic-keywords?${params}`)
          break
        }
        default:
          result = { error: 'Unknown keywords subcommand. Use: organic' }
      }
      break

    case 'top-pages':
      switch (sub) {
        case 'list': {
          if (!args.target) { result = { error: '--target required (domain or URL)' }; break }
          const params = new URLSearchParams({ target: args.target, mode })
          if (args.country) params.set('country', args.country)
          if (args.limit) params.set('limit', args.limit)
          result = await api('GET', `/site-explorer/top-pages?${params}`)
          break
        }
        default:
          result = { error: 'Unknown top-pages subcommand. Use: list' }
      }
      break

    case 'keyword-overview':
      switch (sub) {
        case 'get': {
          const params = new URLSearchParams({ keywords: args.keywords })
          if (args.country) params.set('country', args.country)
          result = await api('GET', `/keywords-explorer/overview?${params}`)
          break
        }
        default:
          result = { error: 'Unknown keyword-overview subcommand. Use: get' }
      }
      break

    case 'keyword-suggestions':
      switch (sub) {
        case 'get': {
          const params = new URLSearchParams({ keyword: args.keyword })
          if (args.country) params.set('country', args.country)
          if (args.limit) params.set('limit', args.limit)
          result = await api('GET', `/keywords-explorer/matching-terms?${params}`)
          break
        }
        default:
          result = { error: 'Unknown keyword-suggestions subcommand. Use: get' }
      }
      break

    case 'serp':
      switch (sub) {
        case 'get': {
          const params = new URLSearchParams({ keyword: args.keyword })
          if (args.country) params.set('country', args.country)
          result = await api('GET', `/keywords-explorer/serp-overview?${params}`)
          break
        }
        default:
          result = { error: 'Unknown serp subcommand. Use: get' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          'domain-rating': 'domain-rating get --target <domain>',
          'backlinks': 'backlinks list --target <domain> [--mode <mode>] [--limit <n>]',
          'refdomains': 'refdomains list --target <domain> [--mode <mode>] [--limit <n>]',
          'keywords': 'keywords organic --target <domain> [--country <cc>] [--limit <n>]',
          'top-pages': 'top-pages list --target <domain> [--country <cc>] [--limit <n>]',
          'keyword-overview': 'keyword-overview get --keywords <kw1,kw2> [--country <cc>]',
          'keyword-suggestions': 'keyword-suggestions get --keyword <keyword> [--country <cc>] [--limit <n>]',
          'serp': 'serp get --keyword <keyword> [--country <cc>]',
          'modes': 'domain (default), subdomains, prefix, exact',
        }
      }
  }
  return result;
}
