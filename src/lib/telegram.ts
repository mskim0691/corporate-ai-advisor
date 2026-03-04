// Telegram Bot Notification Utility

interface TelegramMessage {
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

/**
 * Escape HTML special characters to prevent injection in Telegram messages
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Send a message to Telegram
 */
export async function sendTelegramNotification(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // Skip if Telegram is not configured
  if (!botToken || !chatId) {
    console.warn('Telegram notification skipped: Bot token or chat ID not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

/**
 * Format and send visual report order notification
 */
export async function notifyVisualReportOrder(data: {
  userName: string;
  userEmail: string;
  projectId: string;
  companyName: string;
  industry?: string;
}) {
  const message = `
🔔 <b>비주얼 레포트 신청 알림</b>

👤 <b>사용자:</b> ${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})
🏢 <b>회사명:</b> ${escapeHtml(data.companyName)}
🏭 <b>업종:</b> ${escapeHtml(data.industry || '미지정')}
📋 <b>프로젝트 ID:</b> <code>${escapeHtml(data.projectId)}</code>

⏰ <b>신청 시간:</b> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

👉 관리자 패널에서 확인하세요!
  `.trim();

  return await sendTelegramNotification(message);
}

/**
 * Send test notification to verify Telegram configuration
 */
export async function sendTestNotification(): Promise<boolean> {
  const message = `
✅ <b>테스트 알림</b>

Telegram 봇이 정상적으로 연동되었습니다!

⏰ ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
  `.trim();

  return await sendTelegramNotification(message);
}

/**
 * Format and send customer inquiry notification
 */
export async function notifyCustomerInquiry(data: {
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  inquiryId: string;
}) {
  const message = `
💬 <b>고객센터 문의 알림</b>

👤 <b>사용자:</b> ${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})
📝 <b>제목:</b> ${escapeHtml(data.title)}
💭 <b>내용:</b>
${escapeHtml(data.content)}

📋 <b>문의 ID:</b> <code>${escapeHtml(data.inquiryId)}</code>
⏰ <b>문의 시간:</b> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

👉 관리자 패널에서 답변하세요!
  `.trim();

  return await sendTelegramNotification(message);
}

/**
 * Format and send new user registration notification
 */
export async function notifyNewUserRegistration(data: {
  userName: string;
  userEmail: string;
  userId: string;
}) {
  const message = `
🎉 <b>신규 회원 가입 알림</b>

👤 <b>이름:</b> ${escapeHtml(data.userName)}
📧 <b>이메일:</b> ${escapeHtml(data.userEmail)}
🆔 <b>사용자 ID:</b> <code>${escapeHtml(data.userId)}</code>

⏰ <b>가입 시간:</b> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

👉 관리자 패널에서 확인하세요!
  `.trim();

  return await sendTelegramNotification(message);
}
