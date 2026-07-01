/** Auto-generated CLI registry */
import type { ParsedArgs } from "../lib/cli/parse-args.js";
import type { JsonValue } from "../lib/cli/http-client.js";

export type CliModule = { run: (args: ParsedArgs) => Promise<JsonValue | unknown> };

export const cliLoaders: Record<string, () => Promise<CliModule>> = {
  "activecampaign": () => import("./activecampaign.js"),
  "adobe-analytics": () => import("./adobe-analytics.js"),
  "ahrefs": () => import("./ahrefs.js"),
  "airops": () => import("./airops.js"),
  "amplitude": () => import("./amplitude.js"),
  "apollo": () => import("./apollo.js"),
  "beehiiv": () => import("./beehiiv.js"),
  "brevo": () => import("./brevo.js"),
  "buffer": () => import("./buffer.js"),
  "calendly": () => import("./calendly.js"),
  "clay": () => import("./clay.js"),
  "clearbit": () => import("./clearbit.js"),
  "close": () => import("./close.js"),
  "coupler": () => import("./coupler.js"),
  "crossbeam": () => import("./crossbeam.js"),
  "customer-io": () => import("./customer-io.js"),
  "dataforseo": () => import("./dataforseo.js"),
  "demio": () => import("./demio.js"),
  "dub": () => import("./dub.js"),
  "exa": () => import("./exa.js"),
  "g2": () => import("./g2.js"),
  "ga4": () => import("./ga4.js"),
  "github-prospects": () => import("./github-prospects.js"),
  "google-ads": () => import("./google-ads.js"),
  "google-search-console": () => import("./google-search-console.js"),
  "hotjar": () => import("./hotjar.js"),
  "hunter": () => import("./hunter.js"),
  "instantly": () => import("./instantly.js"),
  "intercom": () => import("./intercom.js"),
  "keywords-everywhere": () => import("./keywords-everywhere.js"),
  "kit": () => import("./kit.js"),
  "klaviyo": () => import("./klaviyo.js"),
  "lemlist": () => import("./lemlist.js"),
  "linkedin-ads": () => import("./linkedin-ads.js"),
  "livestorm": () => import("./livestorm.js"),
  "mailchimp": () => import("./mailchimp.js"),
  "mention-me": () => import("./mention-me.js"),
  "meta-ads": () => import("./meta-ads.js"),
  "mixpanel": () => import("./mixpanel.js"),
  "onesignal": () => import("./onesignal.js"),
  "optimizely": () => import("./optimizely.js"),
  "outreach": () => import("./outreach.js"),
  "paddle": () => import("./paddle.js"),
  "partnerstack": () => import("./partnerstack.js"),
  "pendo": () => import("./pendo.js"),
  "plausible": () => import("./plausible.js"),
  "postmark": () => import("./postmark.js"),
  "rankparse": () => import("./rankparse.js"),
  "resend": () => import("./resend.js"),
  "rewardful": () => import("./rewardful.js"),
  "savvycal": () => import("./savvycal.js"),
  "segment": () => import("./segment.js"),
  "semrush": () => import("./semrush.js"),
  "sendgrid": () => import("./sendgrid.js"),
  "similarweb": () => import("./similarweb.js"),
  "snov": () => import("./snov.js"),
  "supermetrics": () => import("./supermetrics.js"),
  "tiktok-ads": () => import("./tiktok-ads.js"),
  "tolt": () => import("./tolt.js"),
  "trustpilot": () => import("./trustpilot.js"),
  "typeform": () => import("./typeform.js"),
  "wistia": () => import("./wistia.js"),
  "zapier": () => import("./zapier.js"),
  "zoominfo": () => import("./zoominfo.js"),
};

export const cliNames = Object.keys(cliLoaders).sort();

export async function loadCli(name: string): Promise<CliModule | null> {
  const loader = cliLoaders[name];
  return loader ? loader() : null;
}
