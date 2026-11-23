import { loadConfig } from './config.js';
import { createEmailNotifier } from './notifier.js';
import { runScheduledReminder } from './reminder.js';

async function main() {
  const config = loadConfig(process.env);
  const notifier = createEmailNotifier({
    gmailUser: config.gmailUser,
    gmailAppPassword: config.gmailAppPassword,
    toEmail: config.toEmail,
  });

  const result = await runScheduledReminder({ notifier, config });
  console.log(`[MagangHub Reminder] ${JSON.stringify(result)}`);
}

main().catch((error) => {
  console.error('[MagangHub Reminder] Error:', error.message);
  process.exitCode = 1;
});
