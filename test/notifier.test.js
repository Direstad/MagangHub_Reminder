import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmailNotifier } from '../src/notifier.js';

describe('createEmailNotifier', () => {
  it('configures Gmail SMTP transport and sends email with expected fields', async () => {
    let transportConfig = null;
    let sentMail = null;

    const fakeCreateTransport = (cfg) => {
      transportConfig = cfg;
      return {
        sendMail: async (mail) => {
          sentMail = mail;
          return { messageId: 'msg-001' };
        },
      };
    };

    const notifier = createEmailNotifier({
      gmailUser: 'sender@gmail.com',
      gmailAppPassword: 'abcd efgh ijkl mnop',
      toEmail: 'recipient@gmail.com',
      createTransportImpl: fakeCreateTransport,
    });

    await notifier.sendEmail({
      subject: 'Pengingat Absen',
      text: 'Jangan lupa absen',
      html: '<p>Jangan lupa absen</p>',
    });

    assert.equal(transportConfig.service, 'gmail');
    assert.equal(transportConfig.auth.user, 'sender@gmail.com');
    assert.equal(transportConfig.auth.pass, 'abcd efgh ijkl mnop');
    assert.equal(sentMail.to, 'recipient@gmail.com');
    assert.equal(sentMail.subject, 'Pengingat Absen');
    assert.equal(sentMail.text, 'Jangan lupa absen');
    assert.equal(sentMail.html, '<p>Jangan lupa absen</p>');
  });
});
