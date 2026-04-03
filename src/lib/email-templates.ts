// appointment reminder email template (sent 30 min before start)

interface ReminderEmailProps {
  recipientName: string;
  otherPartyName: string;
  otherPartyRole: string;
  date: string;
  time: string;
  meetingLink: string;
}

export function appointmentReminderEmail({
  recipientName,
  otherPartyName,
  otherPartyRole,
  date,
  time,
  meetingLink,
}: ReminderEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color:#00796B;padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">Appointment Reminder ⏰</h1>
    </div>
    
    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hi <strong>${recipientName}</strong>, your appointment is starting in <strong>30 minutes</strong>!
      </p>
      
      <!-- Appointment Details Card -->
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#0f766e;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Session Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">${otherPartyRole}</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${otherPartyName}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Date</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${date}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Time</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${time}</td>
          </tr>
        </table>
      </div>

      <!-- Join Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${meetingLink}" style="display:inline-block;background-color:#00796B;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
          Join Meeting
        </a>
      </div>

      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
        This is an automated email from MindLens AI. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Booking confirmation email template

interface BookingEmailProps {
  patientName: string;
  counselorName: string;
  counselorTitle: string;
  date: string;
  time: string;
  meetingLink: string;
}

export function bookingConfirmationEmail({
  patientName,
  counselorName,
  counselorTitle,
  date,
  time,
  meetingLink,
}: BookingEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color:#00796B;padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">Appointment Confirmed ✓</h1>
    </div>
    
    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hi <strong>${patientName}</strong>, your appointment has been successfully booked!
      </p>
      
      <!-- Appointment Details Card -->
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#0f766e;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Appointment Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Counselor</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${counselorName}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Title</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;">${counselorTitle}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Date</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${date}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Time</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${time}</td>
          </tr>
        </table>
      </div>

      <!-- Join Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${meetingLink}" style="display:inline-block;background-color:#00796B;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
          Join Meeting
        </a>
      </div>

      <!-- Info Note -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;line-height:1.5;margin:0;">
          <strong>Note:</strong> You can join the meeting up to 30 minutes before the scheduled time. Cancellation is allowed up to 4 hours before the appointment.
        </p>
      </div>

      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
        This is an automated email from MindLens AI. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// booking notification email for counselor (when a patient books a session)

interface CounselorBookingEmailProps {
  counselorName: string;
  patientName: string;
  date: string;
  time: string;
  meetingLink: string;
  medicalConcern?: string;
  emotionReportAttached?: boolean;
}

export function counselorBookingNotificationEmail({
  counselorName,
  patientName,
  date,
  time,
  meetingLink,
  medicalConcern,
  emotionReportAttached,
}: CounselorBookingEmailProps): string {
  const medicalConcernSection = medicalConcern
    ? `
      <!-- Medical Concern -->
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
        <p style="color:#0f766e;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Patient's Medical Concern</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">${medicalConcern}</p>
      </div>`
    : "";

  const emotionReportNote = emotionReportAttached
    ? `
      <!-- Emotion Report Attachment Note -->
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
        <p style="color:#5b21b6;font-size:13px;line-height:1.5;margin:0;">
          📎 <strong>Emotion Report Attached:</strong> The patient has shared an emotion analysis report. Please check the attachment in this email.
        </p>
      </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color:#00796B;padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">New Appointment Booked</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hi <strong>${counselorName}</strong>, a new session has been booked with you!
      </p>

      <!-- Appointment Details Card -->
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:20px;margin-bottom:16px;">
        <p style="color:#0f766e;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Session Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Patient</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${patientName}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Date</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${date}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0;">Time</td>
            <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right;font-weight:500;">${time}</td>
          </tr>
        </table>
      </div>

      ${medicalConcernSection}
      ${emotionReportNote}

      <!-- Join Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${meetingLink}" style="display:inline-block;background-color:#00796B;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
          View Appointment
        </a>
      </div>

      <!-- Info Note -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;line-height:1.5;margin:0;">
          <strong>Reminder:</strong> Please mark the appointment as completed after the session ends. Unmarked appointments will be auto-marked as missed after 5 minutes.
        </p>
      </div>

      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
        This is an automated email from MindLens AI. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Booking cancellation email template

interface CancellationEmailProps {
  recipientName: string;
  otherPartyName: string;
  otherPartyRole: string;
  date: string;
  time: string;
}

export function cancellationEmail({
  recipientName,
  otherPartyName,
  otherPartyRole,
  date,
  time,
}: CancellationEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background-color:#dc2626;padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">Appointment Cancelled</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hi <strong>${recipientName}</strong>, your appointment scheduled for <strong>${date}</strong> at <strong>${time}</strong> has been cancelled by the ${otherPartyRole.toLowerCase()} (<strong>${otherPartyName}</strong>).
      </p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 20px;">
        If you have any questions, please contact support.
      </p>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
        This is an automated email from MindLens AI. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Appointment time adjusted email template

interface AdjustedEmailProps {
  patientName: string;
  counselorName: string;
  date: string;
  oldTime: string;
  newTime: string;
  meetingLink: string;
}

export function appointmentAdjustedEmail({
  patientName,
  counselorName,
  date,
  oldTime,
  newTime,
  meetingLink,
}: AdjustedEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color:#00796B;padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">Appointment Time Updated</h1>
    </div>
    
    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
        Hi <strong>${patientName}</strong>, your counselor <strong>${counselorName}</strong> has adjusted the time for your appointment on <strong>${date}</strong>.
      </p>
      
      <!-- Time Change Card -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Time Change</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:6px 0;">Previous Time</td>
            <td style="color:#991b1b;font-size:14px;padding:6px 0;text-align:right;font-weight:500;text-decoration:line-through;">${oldTime}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:6px 0;">New Time</td>
            <td style="color:#065f46;font-size:14px;padding:6px 0;text-align:right;font-weight:600;">${newTime}</td>
          </tr>
        </table>
      </div>

      <!-- Join Button -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${meetingLink}" style="display:inline-block;background-color:#00796B;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
          Join Meeting
        </a>
      </div>

      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0;">
        This is an automated email from MindLens AI. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


// warn patient approaching suspension (7 reports)
export function patientSuspendWarningEmail({ patientName }: { patientName: string }): string {
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#d97706;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Account Warning</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px">Hi <strong>${patientName}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px">Your account has received multiple conduct reports from counselors. If this continues, your account will be <strong>automatically suspended</strong>.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#92400e;font-size:14px;line-height:1.5;margin:0"><strong>Action required:</strong> Please review MindLens AI community guidelines. Continued violations will result in a 5-day suspension.</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// warn patient approaching ban (15 reports)
export function patientBanWarningEmail({ patientName }: { patientName: string }): string {
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#dc2626;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Final Warning — Ban Risk</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px">Hi <strong>${patientName}</strong>,</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px">Your account is at high risk of a <strong>permanent ban</strong> due to continued conduct violations.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#991b1b;font-size:14px;line-height:1.5;margin:0"><strong>This is your final warning.</strong> Any further violations will result in a permanent ban from MindLens AI.</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// notify patient they have been suspended
export function patientSuspendedEmail({ patientName, days, suspendedUntil, reason }: { patientName: string; days: number; suspendedUntil: string; reason?: string; }): string {
  const reasonRow = reason
    ? `
        <tr>
          <td style="color:#6b7280;font-size:14px;padding:4px 0">Reason</td>
          <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right">${reason}</td>
        </tr>`
    : "";
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#d97706;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Account Suspended</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${patientName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your account has been suspended for <strong>${days} day${days !== 1 ? "s" : ""}</strong>.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0">Duration</td>
            <td style="color:#92400e;font-size:14px;font-weight:600;padding:4px 0;text-align:right">${days} day${days !== 1 ? "s" : ""}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0">Restored on</td>
            <td style="color:#111827;font-size:14px;font-weight:500;padding:4px 0;text-align:right">${suspendedUntil}</td>
          </tr>${reasonRow}
        </table>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px">You can still log in and view your profile. All other features are unavailable until the suspension ends.</p>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// notify patient they have been permanently banned
export function patientBannedEmail({ patientName, reason }: { patientName: string; reason?: string; }): string {
  const reasonText = reason
    ? `<strong>Reason:</strong> ${reason}`
    : "Your account accumulated an excessive number of conduct reports, violating our community standards.";
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#dc2626;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Account Banned</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${patientName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your account has been permanently banned from MindLens AI due to repeated violations of our terms and conditions.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:16px">
        <p style="color:#991b1b;font-size:14px;line-height:1.5;margin:0">${reasonText}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px">You may still log in to view your profile, but all platform features are permanently inaccessible.</p>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// warn counselor approaching suspension (7 one-star reviews)
export function counselorSuspendWarningEmail({ counselorName }: { counselorName: string }): string {
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#d97706;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Quality Warning</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${counselorName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your profile has received a significant number of 1-star reviews. If this continues, your account will be <strong>automatically suspended</strong>.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#92400e;font-size:14px;line-height:1.5;margin:0">Please review patient feedback and improve session quality. Continued low ratings will result in a 5-day suspension.</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// warn counselor approaching ban (15 one-star reviews)
export function counselorBanWarningEmail({ counselorName }: { counselorName: string }): string {
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#dc2626;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Final Warning — Ban Risk</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${counselorName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your account has accumulated a critically high number of 1-star reviews. You are at serious risk of a <strong>permanent ban</strong>.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#991b1b;font-size:14px;line-height:1.5;margin:0"><strong>Final warning.</strong> Additional 1-star reviews will result in a permanent ban and revocation of marketplace visibility.</p>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// notify counselor they have been suspended
export function counselorSuspendedEmail({ counselorName, days, suspendedUntil, reason }: { counselorName: string; days: number; suspendedUntil: string; reason?: string; }): string {
  const reasonRow = reason
    ? `
        <tr>
          <td style="color:#6b7280;font-size:14px;padding:4px 0">Reason</td>
          <td style="color:#111827;font-size:14px;padding:4px 0;text-align:right">${reason}</td>
        </tr>`
    : "";
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#d97706;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Account Suspended</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${counselorName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your counselor account has been suspended for <strong>${days} day${days !== 1 ? "s" : ""}</strong>. You will not be visible to patients during this period.</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0">Duration</td>
            <td style="color:#92400e;font-size:14px;font-weight:600;padding:4px 0;text-align:right">${days} day${days !== 1 ? "s" : ""}</td>
          </tr>
          <tr>
            <td style="color:#6b7280;font-size:14px;padding:4px 0">Restored on</td>
            <td style="color:#111827;font-size:14px;font-weight:500;padding:4px 0;text-align:right">${suspendedUntil}</td>
          </tr>${reasonRow}
        </table>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px">You can still log in and view your profile. Marketplace visibility and scheduling tools restore automatically when the suspension ends.</p>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// notify counselor they have been permanently banned
export function counselorBannedEmail({ counselorName, reason }: { counselorName: string; reason?: string; }): string {
  const reasonText = reason
    ? `<strong>Reason:</strong> ${reason}`
    : "Your account accumulated an excessive number of 1-star ratings, violating our platform standards.";
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#dc2626;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Account Banned</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${counselorName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your counselor account has been permanently banned and your visibility revoked from MindLens AI.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:16px">
        <p style="color:#991b1b;font-size:14px;line-height:1.5;margin:0">${reasonText}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0 0 24px">You may still log in to view your profile, but all counselor features and marketplace visibility have been permanently removed.</p>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// notify patient their ban was lifted (manual unban by admin)
export function patientUnbannedEmail({
  patientName,
  dashboardUrl,
}: {
  patientName: string;
  dashboardUrl: string;
}): string {
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#00796B;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Account Reinstated</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${patientName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your permanent ban has been <strong>lifted</strong> by an administrator. Full access to MindLens AI has been restored.</p>
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#0f766e;font-size:14px;line-height:1.5;margin:0">You can use all patient features again, including booking and appointments.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${dashboardUrl}" style="display:inline-block;background-color:#00796B;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">Open your dashboard</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// notify counselor their ban was lifted (manual unban by admin)
export function counselorUnbannedEmail({
  counselorName,
  dashboardUrl,
}: {
  counselorName: string;
  dashboardUrl: string;
}): string {
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#00796B;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Account Reinstated</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${counselorName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Your permanent ban has been <strong>lifted</strong> by an administrator. Your counselor account and marketplace visibility are restored.</p>
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#0f766e;font-size:14px;line-height:1.5;margin:0">You can use all counselor features again, including availability and patient bookings.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${dashboardUrl}" style="display:inline-block;background-color:#00796B;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">Open your dashboard</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// notify patient their suspension ended (manual unsuspend by admin, or automatic when period expires)
export function patientUnsuspendedEmail({
  patientName,
  dashboardUrl,
  automatic,
}: {
  patientName: string;
  dashboardUrl: string;
  automatic: boolean;
}): string {
  const mainParagraph = automatic
    ? "Your suspension period has <strong>ended</strong>. Full access to MindLens AI has been restored automatically."
    : "An administrator has <strong>lifted your suspension</strong>. Full access to MindLens AI has been restored.";
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#00796B;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Suspension Lifted</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${patientName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">${mainParagraph}</p>
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#0f766e;font-size:14px;line-height:1.5;margin:0">You can use all patient features again, including booking and appointments.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${dashboardUrl}" style="display:inline-block;background-color:#00796B;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">Open your dashboard</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// notify counselor their suspension ended (manual unsuspend by admin, or automatic when period expires)
export function counselorUnsuspendedEmail({
  counselorName,
  dashboardUrl,
  automatic,
}: {
  counselorName: string;
  dashboardUrl: string;
  automatic: boolean;
}): string {
  const mainParagraph = automatic
    ? "Your suspension period has <strong>ended</strong>. Your counselor account and marketplace access have been restored automatically."
    : "An administrator has <strong>lifted your suspension</strong>. Your counselor account and marketplace visibility are restored.";
  return `
<html>
<body style="font-family:sans-serif;background:#f3f4f6;margin:0;padding:0">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#00796B;padding:32px 24px;text-align:center">
      <h1 style="color:#fff;font-size:22px;margin:0">Suspension Lifted</h1>
    </div>
    <div style="padding:32px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <strong>${counselorName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 16px">${mainParagraph}</p>
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="color:#0f766e;font-size:14px;line-height:1.5;margin:0">You can use all counselor features again, including availability and patient bookings.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${dashboardUrl}" style="display:inline-block;background-color:#00796B;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600">Open your dashboard</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;margin:0">This is an automated email from MindLens AI. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
