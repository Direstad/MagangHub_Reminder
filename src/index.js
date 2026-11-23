import { loadConfig } from './config.js';
import { createMagangHubClient } from './maganghub.js';
import { createEmailNotifier } from './notifier.js';
import { runReminderCheck } from './reminder.js';

async function main() {
  const config = loadConfig(process.env);
  const client = createMagangHubClient({
    authToken: config.authToken,
    cookie: config.cookie,
    apiBase: config.apiBase,
  });
  const notifier = createEmailNotifier({
    gmailUser: config.gmailUser,
    gmailAppPassword: config.gmailAppPassword,
    toEmail: config.toEmail,
  });

  const result = await runReminderCheck({ client, notifier, config });
  console.log(`[MagangHub Reminder] ${JSON.stringify(result)}`);
}

main().catch((error) => {
  console.error('[MagangHub Reminder] Error:', error.message);
  process.exitCode = 1;
});
