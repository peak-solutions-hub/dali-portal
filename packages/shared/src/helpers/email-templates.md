# Supabase Email Templates Configuration

This document contains the email templates that should be configured in the Supabase dashboard.

## How to Configure

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select the template type (Invite User, Reset Password, etc.)
3. Copy and paste the HTML template below
4. Save changes

---

## Invite User Template

**Subject:** Account Invitation - Iloilo City Council DALI Portal

**Template:**

```html
<table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <tbody>
    <tr>
      <td style="background-color: #a60202; padding: 40px 30px; text-align: center;">
        <img src="https://nuhhfqopetrlqzheqthe.supabase.co/storage/v1/object/public/assets/iloilo-city-seal.png" alt="Iloilo City Council Logo" style="width: 80px; height: 80px; margin: 0 auto 20px auto; display: block;" />
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
          Iloilo City Council
        </h1>
        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
          DALI Portal Internal Management
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; background-color: #ffffff;">
        <h2 style="color: #a60202; margin: 0 0 20px 0; font-size: 22px;">
          Account Activation Required
        </h2>
        <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
          You have been invited as a user to the Iloilo City Council DALI Portal Internal Management system.
        </p>
        <p style="color: #333333; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
          To activate your account and get started, please click the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ .ConfirmationURL }}" style="background-color: #a60202; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
            Activate Account
          </a>
        </div>
        <p style="color: #666666; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
          If you did not request this invitation, you can safely ignore this email.
        </p>
        <p style="color: #999999; margin: 20px 0 0 0; font-size: 12px; line-height: 1.6;">
          This link will expire in 24 hours for security purposes.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 3px solid #a60202;">
        <p style="color: #999999; margin: 0 0 10px 0; font-size: 13px;">
          © 2026 Iloilo City Council - DALI Portal
        </p>
        <p style="color: #999999; margin: 0; font-size: 13px;">
          Internal Management System
        </p>
      </td>
    </tr>
  </tbody>
</table>
```

**Important Configuration:**
- Make sure the "Confirm your mail" redirect URL in Supabase settings points to: `{{ .SiteURL }}/auth/confirm`
- Do NOT add any query parameters - Supabase will automatically add `?token_hash=xxx&type=invite`

---

## Reset Password Template

**Subject:** Password Reset Request - Iloilo City Council DALI Portal

**Template:**

```html
<table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <tbody>
    <tr>
      <td style="background-color: #a60202; padding: 40px 30px; text-align: center;">
        <img src="https://nuhhfqopetrlqzheqthe.supabase.co/storage/v1/object/public/assets/iloilo-city-seal.png" alt="Iloilo City Council Logo" style="width: 80px; height: 80px; margin: 0 auto 20px auto; display: block;" />
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
          Iloilo City Council
        </h1>
        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
          DALI Portal Internal Management
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px; background-color: #ffffff;">
        <h2 style="color: #a60202; margin: 0 0 20px 0; font-size: 22px;">
          Password Reset Request
        </h2>
        <p style="color: #333333; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password for the DALI Portal Internal Management system.
        </p>
        <p style="color: #333333; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
          To reset your password, please click the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ .ConfirmationURL }}" style="background-color: #a60202; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666666; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
          If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
        <p style="color: #999999; margin: 20px 0 0 0; font-size: 12px; line-height: 1.6;">
          This link will expire in 1 hour for security purposes.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 3px solid #a60202;">
        <p style="color: #999999; margin: 0 0 10px 0; font-size: 13px;">
          © 2026 Iloilo City Council - DALI Portal
        </p>
        <p style="color: #999999; margin: 0; font-size: 13px;">
          Internal Management System
        </p>
      </td>
    </tr>
  </tbody>
</table>
```

**Important Configuration:**
- Make sure the "Reset your password" redirect URL in Supabase settings points to: `{{ .SiteURL }}/auth/confirm`
- Do NOT add any query parameters - Supabase will automatically add `?token_hash=xxx&type=recovery`

---

## Email Flow Explanation

### Invite User Flow
1. Admin invites user via backend API
2. Backend calls `supabase.auth.admin.inviteUserByEmail(email, { redirectTo: "http://localhost:3001/auth/confirm" })`
3. Supabase sends email with button linking to: `http://localhost:3001/auth/confirm?token_hash=xxx&type=invite`
4. User clicks button → goes to `/auth/confirm`
5. `/auth/confirm` route verifies OTP with `verifyOtp()`
6. On success, redirects to: `/auth/set-password?mode=invite`
7. User sets password and account is activated

### Forgot Password Flow
1. User submits forgot password form
2. Frontend calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: "http://localhost:3001/auth/confirm" })`
3. Supabase sends email with button linking to: `http://localhost:3001/auth/confirm?token_hash=xxx&type=recovery`
4. User clicks button → goes to `/auth/confirm`
5. `/auth/confirm` route verifies OTP with `verifyOtp()`
6. On success, redirects to: `/auth/set-password?mode=reset`
7. User sets new password

---

## Troubleshooting

### Issue: Email link redirects to error page

**Possible causes:**
1. **Wrong redirect URL configured in backend**
   - Check `apps/backend/src/app/users/users.service.ts` - should use `/auth/confirm` not `/auth/callback`
   - Check `apps/admin/src/helpers/auth/auth-handlers.ts` - `resetPasswordForEmail` should use `/auth/confirm`

2. **Supabase dashboard configuration**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Set "Site URL" to your admin URL (e.g., `http://localhost:3001`)
   - Set "Redirect URLs" to include: `http://localhost:3001/auth/confirm`

3. **Token expired**
   - Invite links expire after 24 hours
   - Reset password links expire after 1 hour
   - User needs to request a new link

### Issue: User redirected to sign-in after clicking link

**Solution:**
- Make sure `/auth/set-password` is NOT using the `useRoleProtection` hook
- The proxy middleware should allow PASSWORD_SETUP_ROUTES
- Check that ALLOWED_UNAUTHENTICATED_ROUTES includes `/auth/set-password`

---

## Environment-Specific Configuration

### Development (localhost)
- Site URL: `http://localhost:3001`
- Redirect URLs: `http://localhost:3001/auth/confirm`

### Production
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/confirm`

Make sure to update these in:
1. Supabase Dashboard → Authentication → URL Configuration
2. Backend `.env` file → `ADMIN_URL` variable
