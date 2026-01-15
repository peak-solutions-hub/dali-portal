interface InquiryConfirmationEmailProps {
	citizenName: string;
	referenceNumber: string;
	subject: string;
	category: string;
	portalUrl?: string;
}

export function generateInquiryConfirmationEmail({
	citizenName,
	referenceNumber,
	subject,
	category,
	portalUrl = "https://dali-portal.josearron.dev",
}: InquiryConfirmationEmailProps): string {
	const formatCategory = (cat: string) =>
		cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Received - ${referenceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #a60202; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">
                Office of the Vice Mayor
              </h1>
              <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px;">
                Iloilo City
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${citizenName}</strong>,
              </p>
              
              <p style="margin: 0 0 32px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                Thank you for reaching out. We have received your inquiry and our team will review it shortly.
              </p>

              <!-- Reference Number Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #fafafa; border: 2px dashed #e0e0e0; border-radius: 12px; padding: 28px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #888888; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                      Your Reference Number
                    </p>
                    <p style="margin: 0; color: #a60202; font-size: 32px; font-weight: 700; font-family: 'SF Mono', Monaco, 'Courier New', monospace; letter-spacing: 1px;">
                      ${referenceNumber}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Inquiry Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px; border-left: 3px solid #a60202; padding-left: 16px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px 0; color: #888888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Subject
                    </p>
                    <p style="margin: 0 0 16px 0; color: #333333; font-size: 15px;">
                      ${subject}
                    </p>
                    <p style="margin: 0 0 4px 0; color: #888888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Category
                    </p>
                    <p style="margin: 0; color: #333333; font-size: 15px;">
                      ${formatCategory(category)}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Track Instructions -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="background-color: #fff8f8; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #a60202; font-size: 14px; font-weight: 600;">
                      How to track your inquiry:
                    </p>
                    <ol style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8;">
                      <li>Visit the DALI Portal</li>
                      <li>Go to the "Inquiries" page</li>
                      <li>Select "Track Inquiry"</li>
                      <li>Enter your reference number and email address</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}/inquiries" style="display: inline-block; background-color: #a60202; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
                      Track Your Inquiry
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Closing -->
              <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: #333333;">Office of the Vice Mayor</strong><br>
                <span style="color: #888888; font-size: 14px;">Iloilo City</span>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 8px 0; color: #888888; font-size: 12px; text-align: center;">
                This is an automated message. Please do not reply directly to this email.
              </p>
              <p style="margin: 0; color: #aaaaaa; font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} Office of the Vice Mayor, Iloilo City
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function generateInquiryConfirmationText({
	citizenName,
	referenceNumber,
	subject,
	category,
	portalUrl = "https://dali-portal.josearron.dev",
}: InquiryConfirmationEmailProps): string {
	const formatCategory = (cat: string) =>
		cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

	return `
Office of the Vice Mayor - Iloilo City
=======================================

Dear ${citizenName},

Thank you for reaching out. We have received your inquiry and our team will review it shortly.

YOUR REFERENCE NUMBER: ${referenceNumber}

Inquiry Details:
- Subject: ${subject}
- Category: ${formatCategory(category)}

How to track your inquiry:
1. Visit the DALI Portal at ${portalUrl}/inquiries
2. Go to the "Inquiries" page
3. Select "Track Inquiry"
4. Enter your reference number and email address

Best regards,
Office of the Vice Mayor
Iloilo City

---
This is an automated message. Please do not reply directly to this email.
© ${new Date().getFullYear()} Office of the Vice Mayor, Iloilo City
`;
}
