// @ts-nocheck
/** semrush CLI — migrated from tools/clis/semrush.js */
let _dryRun = false;

const API_KEY = process.env.SEMRUSH_API_KEY
const BASE_URL = 'https://api.semrush.com/'



function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(';')
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = lines[i].split(';')
    const row = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || ''
    }
    rows.push(row)
  }
  return rows
}

async function api(params) {
  params.set('key', API_KEY)
  params.set('export_escape', '1')
  if (_dryRun) {
    const maskedParams = new URLSearchParams(params)
    maskedParams.set('key', '***')
    return { _dry_run: true, method: 'GET', url: `${BASE_URL}?${maskedParams}`, headers: {}, body: undefined }
  }
  const res = await fetch(`${BASE_URL}?${params}`)
  const text = await res.text()
  if (!res.ok) {
    return { error: text.trim(), status: res.status }
  }
  if (text.startsWith('ERROR')) {
    return { error: text.trim() }
  }
  return parseCSV(text)
}



export async function run(args) {
  _dryRun = args['dry-run'] === true;
  if (!API_KEY) throw new Error('SEMRUSH_API_KEY environment variable required');
  const [cmd, sub] = args._;
  let result
  const database = args.database || 'us'

  switch (cmd) {
    case 'domain':
      switch (sub) {
        case 'overview': {
          if (!args.domain) { result = { error: '--domain required' }; break }
          const params = new URLSearchParams({
            type: 'domain_ranks',
            export_columns: 'Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac',
            domain: args.domain,
          })
          result = await api(params)
          break
        }
        case 'organic': {
          if (!args.domain) { result = { error: '--domain required' }; break }
          const params = new URLSearchParams({
            type: 'domain_organic',
            export_columns: 'Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co,Nr',
            domain: args.domain,
            database,
          })
          if (args.limit) params.set('display_limit', args.limit)
          result = await api(params)
          break
        }
        case 'competitors': {
          if (!args.domain) { result = { error: '--domain required' }; break }
          const params = new URLSearchParams({
            type: 'domain_organic_organic',
            export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad',
            domain: args.domain,
            database,
          })
          if (args.limit) params.set('display_limit', args.limit)
          result = await api(params)
          break
        }
        default:
          result = { error: 'Unknown domain subcommand. Use: overview, organic, competitors' }
      }
      break

    case 'keywords':
      switch (sub) {
        case 'overview': {
          if (!args.phrase) { result = { error: '--phrase required' }; break }
          const params = new URLSearchParams({
            type: 'phrase_all',
            export_columns: 'Ph,Nq,Cp,Co,Nr',
            phrase: args.phrase,
            database,
          })
          result = await api(params)
          break
        }
        case 'related': {
          if (!args.phrase) { result = { error: '--phrase required' }; break }
          const params = new URLSearchParams({
            type: 'phrase_related',
            export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
            phrase: args.phrase,
            database,
          })
          if (args.limit) params.set('display_limit', args.limit)
          result = await api(params)
          break
        }
        case 'difficulty': {
          if (!args.phrase) { result = { error: '--phrase required' }; break }
          const params = new URLSearchParams({
            type: 'phrase_kdi',
            export_columns: 'Ph,Kd',
            phrase: args.phrase,
            database,
          })
          result = await api(params)
          break
        }
        default:
          result = { error: 'Unknown keywords subcommand. Use: overview, related, difficulty' }
      }
      break

    case 'backlinks':
      switch (sub) {
        case 'overview': {
          const params = new URLSearchParams({
            type: 'backlinks_overview',
            target: args.target,
            target_type: 'root_domain',
          })
          result = await api(params)
          break
        }
        case 'list': {
          const params = new URLSearchParams({
            type: 'backlinks',
            target: args.target,
            target_type: 'root_domain',
            export_columns: 'source_url,source_title,target_url,anchor',
          })
          if (args.limit) params.set('display_limit', args.limit)
          result = await api(params)
          break
        }
        default:
          result = { error: 'Unknown backlinks subcommand. Use: overview, list' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          'domain overview': 'domain overview --domain <domain>',
          'domain organic': 'domain organic --domain <domain> [--database <db>] [--limit <n>]',
          'domain competitors': 'domain competitors --domain <domain> [--database <db>] [--limit <n>]',
          'keywords overview': 'keywords overview --phrase <phrase> [--database <db>]',
          'keywords related': 'keywords related --phrase <phrase> [--database <db>] [--limit <n>]',
          'keywords difficulty': 'keywords difficulty --phrase <phrase> [--database <db>]',
          'backlinks overview': 'backlinks overview --target <domain>',
          'backlinks list': 'backlinks list --target <domain> [--limit <n>]',
          'databases': 'us (default), uk, de, fr, ca, au, etc.',
        }
      }
  }
  return result;
}
