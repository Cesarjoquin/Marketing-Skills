// @ts-nocheck
/** sendgrid CLI — migrated from tools/clis/sendgrid.js */
let _dryRun = false;

const API_KEY = process.env.SENDGRID_API_KEY
const BASE_URL = 'https://api.sendgrid.com/v3'



async function api(method, path, body) {
  if (_dryRun) {
    return { _dry_run: true, method, url: `${BASE_URL}${path}`, headers: { 'Authorization': '***', 'Content-Type': 'application/json' }, body: body || undefined }
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
  if (!API_KEY) throw new Error('SENDGRID_API_KEY environment variable required');
  const [cmd, sub] = args._;
  let result

  switch (cmd) {
    case 'send': {
      if (!args.from || !args.to || !args.subject) { result = { error: '--from, --to, and --subject required' }; break }
      const body = {
        personalizations: [{
          to: args.to.split(',').map(e => ({ email: e.trim() })),
        }],
        from: { email: args.from },
        subject: args.subject,
      }
      if (args['template-id']) {
        body.template_id = args['template-id']
        if (args['template-data']) {
          try { body.personalizations[0].dynamic_template_data = JSON.parse(args['template-data']) } catch (e) { result = { error: 'Invalid JSON for --template-data: ' + e.message }; break }
        }
      } else {
        const content = []
        if (args.text) content.push({ type: 'text/plain', value: args.text })
        if (args.html) content.push({ type: 'text/html', value: args.html })
        if (content.length > 0) body.content = content
      }
      if (args.cc) body.personalizations[0].cc = args.cc.split(',').map(e => ({ email: e.trim() }))
      if (args.bcc) body.personalizations[0].bcc = args.bcc.split(',').map(e => ({ email: e.trim() }))
      if (args['reply-to']) body.reply_to = { email: args['reply-to'] }
      result = await api('POST', '/mail/send', body)
      break
    }

    case 'contacts':
      switch (sub) {
        case 'list':
          result = await api('GET', '/marketing/contacts')
          break
        case 'add': {
          const body = {
            contacts: [{
              email: args.email,
            }],
          }
          if (args['first-name']) body.contacts[0].first_name = args['first-name']
          if (args['last-name']) body.contacts[0].last_name = args['last-name']
          if (args['list-ids']) body.list_ids = args['list-ids'].split(',')
          result = await api('PUT', '/marketing/contacts', body)
          break
        }
        case 'search': {
          const body = { query: args.query }
          result = await api('POST', '/marketing/contacts/search', body)
          break
        }
        default:
          result = { error: 'Unknown contacts subcommand. Use: list, add, search' }
      }
      break

    case 'campaigns':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args.limit) params.set('page_size', args.limit)
          result = await api('GET', `/marketing/campaigns?${params}`)
          break
        }
        case 'get':
          if (!rest[0]) { result = { error: 'Campaign ID required' }; break }
          result = await api('GET', `/marketing/campaigns/${rest[0]}`)
          break
        default:
          result = { error: 'Unknown campaigns subcommand. Use: list, get' }
      }
      break

    case 'stats': {
      switch (sub) {
        case 'get': {
          const params = new URLSearchParams()
          if (args['start-date']) params.set('start_date', args['start-date'])
          if (args['end-date']) params.set('end_date', args['end-date'])
          result = await api('GET', `/stats?${params}`)
          break
        }
        default:
          result = { error: 'Unknown stats subcommand. Use: get' }
      }
      break
    }

    case 'bounces':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args['start-time']) params.set('start_time', args['start-time'])
          if (args['end-time']) params.set('end_time', args['end-time'])
          if (args.limit) params.set('limit', args.limit)
          result = await api('GET', `/suppression/bounces?${params}`)
          break
        }
        default:
          result = { error: 'Unknown bounces subcommand. Use: list' }
      }
      break

    case 'spam-reports':
      switch (sub) {
        case 'list': {
          const params = new URLSearchParams()
          if (args['start-time']) params.set('start_time', args['start-time'])
          if (args['end-time']) params.set('end_time', args['end-time'])
          if (args.limit) params.set('limit', args.limit)
          result = await api('GET', `/suppression/spam_reports?${params}`)
          break
        }
        default:
          result = { error: 'Unknown spam-reports subcommand. Use: list' }
      }
      break

    case 'validate':
      switch (sub) {
        case 'email': {
          if (!args.email && !rest[0]) { result = { error: '--email required' }; break }
          const body = { email: args.email || rest[0] }
          result = await api('POST', '/validations/email', body)
          break
        }
        default: {
          const body = { email: sub }
          result = await api('POST', '/validations/email', body)
          break
        }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          send: 'send --from <email> --to <email> --subject <subject> --html <html> [--text <text>] [--template-id <id>] [--template-data <json>]',
          contacts: 'contacts [list|add|search] [--email <email>] [--first-name <name>] [--last-name <name>] [--list-ids <ids>] [--query <sgql>]',
          campaigns: 'campaigns [list|get] [id] [--limit <n>]',
          stats: 'stats get [--start-date <YYYY-MM-DD>] [--end-date <YYYY-MM-DD>]',
          bounces: 'bounces list [--start-time <ts>] [--end-time <ts>] [--limit <n>]',
          'spam-reports': 'spam-reports list [--start-time <ts>] [--end-time <ts>] [--limit <n>]',
          validate: 'validate <email> OR validate email --email <email>',
        }
      }
  }
  return result;
}
