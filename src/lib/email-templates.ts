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
}

export function counselorBookingNotificationEmail({
  counselorName,
  patientName,
  date,
  time,
  meetingLink,
}: CounselorBookingEmailProps): string {
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
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:20px;margin-bottom:24px;">
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
