// @ts-nocheck
/** outreach CLI — migrated from tools/clis/outreach.js */
let _dryRun = false;

const ACCESS_TOKEN = process.env.OUTREACH_ACCESS_TOKEN
const BASE_URL = 'https://api.outreach.io/api/v2'



async function api(method, path, body) {
  const url = `${BASE_URL}${path}`
  if (_dryRun) {
    return { _dry_run: true, method, url, headers: { 'Authorization': 'Bearer ***', 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' }, body: body || undefined }
  }
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
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
  if (!ACCESS_TOKEN) throw new Error('OUTREACH_ACCESS_TOKEN environment variable required');
  const [cmd, sub] = args._;
  let result

  switch (cmd) {
    case 'prospects':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.page) params.set('page[number]', args.page)
          if (args['per-page']) params.set('page[size]', args['per-page'])
          const qs = params.toString()
          result = await api('GET', `/prospects${qs ? '?' + qs : ''}`)
          break
        }
        case 'get': {
          const id = args.id
          if (!id) { result = { error: '--id required' }; break }
          result = await api('GET', `/prospects/${id}`)
          break
        }
        case 'create': {
          const email = args.email
          if (!email) { result = { error: '--email required' }; break }
          const attributes = { emails: [email] }
          if (args['first-name']) attributes.firstName = args['first-name']
          if (args['last-name']) attributes.lastName = args['last-name']
          const body = { data: { type: 'prospect', attributes } }
          result = await api('POST', '/prospects', body)
          break
        }
        default:
          result = { error: 'Unknown prospects subcommand. Use: list, get, create' }
      }
      break

    case 'sequences':
      switch (sub) {
        case 'list': {
          result = await api('GET', '/sequences')
          break
        }
        case 'get': {
          const id = args.id
          if (!id) { result = { error: '--id required' }; break }
          result = await api('GET', `/sequences/${id}`)
          break
        }
        default:
          result = { error: 'Unknown sequences subcommand. Use: list, get' }
      }
      break

    case 'sequence-states':
      switch (sub) {
        case 'create': {
          const sequenceId = args['sequence-id']
          const prospectId = args['prospect-id']
          if (!sequenceId) { result = { error: '--sequence-id required' }; break }
          if (!prospectId) { result = { error: '--prospect-id required' }; break }
          const body = {
            data: {
              type: 'sequenceState',
              relationships: {
                prospect: { data: { type: 'prospect', id: prospectId } },
                sequence: { data: { type: 'sequence', id: sequenceId } },
              },
            },
          }
          result = await api('POST', '/sequenceStates', body)
          break
        }
        default:
          result = { error: 'Unknown sequence-states subcommand. Use: create' }
      }
      break

    case 'mailings':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args['sequence-id']) params.set('filter[sequence][id]', args['sequence-id'])
          const qs = params.toString()
          result = await api('GET', `/mailings${qs ? '?' + qs : ''}`)
          break
        }
        default:
          result = { error: 'Unknown mailings subcommand. Use: list' }
      }
      break

    case 'accounts':
      switch (sub) {
        case 'list': {
          result = await api('GET', '/accounts')
          break
        }
        case 'get': {
          const id = args.id
          if (!id) { result = { error: '--id required' }; break }
          result = await api('GET', `/accounts/${id}`)
          break
        }
        default:
          result = { error: 'Unknown accounts subcommand. Use: list, get' }
      }
      break

    case 'tasks':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.status) params.set('filter[status]', args.status)
          const qs = params.toString()
          result = await api('GET', `/tasks${qs ? '?' + qs : ''}`)
          break
        }
        default:
          result = { error: 'Unknown tasks subcommand. Use: list' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          prospects: {
            list: 'prospects list [--page <n>] [--per-page <n>]',
            get: 'prospects get --id <id>',
            create: 'prospects create --email <email> [--first-name <name>] [--last-name <name>]',
          },
          sequences: {
            list: 'sequences list',
            get: 'sequences get --id <id>',
          },
          'sequence-states': {
            create: 'sequence-states create --sequence-id <id> --prospect-id <id>',
          },
          mailings: {
            list: 'mailings list [--sequence-id <id>]',
          },
          accounts: {
            list: 'accounts list',
            get: 'accounts get --id <id>',
          },
          tasks: {
            list: 'tasks list [--status <status>]',
          },
        }
      }
  }
  return result;
}
