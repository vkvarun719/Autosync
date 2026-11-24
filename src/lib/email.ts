import { Resend } from 'resend'
import nodemailer from 'nodemailer'

interface SendOtpParams {
  toEmail: string
  otp: string
}

export async function sendOtpEmail({ toEmail, otp }: SendOtpParams): Promise<{ success: boolean; provider: string; error?: string; message?: string }> {
  const cleanEmail = toEmail.toLowerCase().trim()
  const subject = `Your AutoSync Access Code: ${otp}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>AutoSync RVITM Access Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f1115; color: #f1f3f7;">
        <div style="max-width: 520px; margin: 40px auto; background-color: #171a21; border: 1px solid #262b36; border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Logo & Brand Header -->
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: #10b981; display: inline-block; text-align: center; line-height: 38px; font-weight: 800; color: #0f1115; font-size: 18px;">
              A
            </div>
            <div style="display: inline-block; vertical-align: top; margin-left: 10px;">
              <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">AutoSync</div>
              <div style="font-size: 11px; color: #10b981; font-weight: 600;">RVITM Campus Commute</div>
            </div>
          </div>

          <!-- Headline -->
          <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">
            Verify Your RVITM Student Email
          </h2>
          <p style="color: #9aa1b2; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
            Use the 6-digit access code below to sign in to AutoSync and connect with verified RVITM students commuting to campus:
          </p>

          <!-- 6-Digit OTP Box -->
          <div style="background-color: #0f1115; border: 1px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <div style="font-size: 12px; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
              6-Digit Verification Code
            </div>
            <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace;">
              ${otp}
            </div>
          </div>

          <p style="color: #9aa1b2; font-size: 12px; line-height: 1.5; margin: 0 0 24px 0;">
            ⏱️ This code is valid for <strong>10 minutes</strong>. If you did not request this login, you can safely ignore this email.
          </p>

          <hr style="border: none; border-top: 1px solid #262b36; margin: 24px 0;" />

          <!-- Security note -->
          <div style="font-size: 11px; color: #6b7280; line-height: 1.5;">
            🔒 AutoSync is exclusive to verified RVITM students. All rides are tracked with peer safety guardrails, equal UPI split, and zero commission.
          </div>
        </div>
      </body>
    </html>
  `

  // 1. Try Resend if RESEND_API_KEY is configured
  const resendApiKey = process.env.RESEND_API_KEY?.trim()
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const resend = new Resend(resendApiKey)
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'AutoSync RVITM <onboarding@resend.dev>'

      let result = await resend.emails.send({
        from: fromEmail,
        to: cleanEmail,
        subject,
        html: htmlContent
      })

      if (result.error) {
        console.warn(`[Resend Sandbox Notice]: ${result.error.message}`)

        // If in Resend Sandbox mode (can only send to verified account email vkvarun719@gmail.com)
        const match = result.error.message.match(/your own email address \(([^)]+)\)/i)
        const fallbackRecipient = match ? match[1] : 'vkvarun719@gmail.com'

        if (fallbackRecipient && fallbackRecipient.toLowerCase() !== cleanEmail) {
          console.log(`[Resend Sandbox] Forwarding live OTP for ${cleanEmail} to your verified email: ${fallbackRecipient}`)
          const fallbackRes = await resend.emails.send({
            from: fromEmail,
            to: fallbackRecipient,
            subject: `[AutoSync RVITM] Access Code for ${cleanEmail}: ${otp}`,
            html: `
              <div style="background-color: #0f1115; color: #f1f3f7; padding: 24px; font-family: sans-serif; border-radius: 12px; border: 1px solid #10b981;">
                <p style="color: #10b981; font-weight: bold; margin-top: 0;">🚀 AutoSync RVITM Live OTP Dispatch</p>
                <p>A student login was requested for: <strong style="color: #ffffff;">${cleanEmail}</strong></p>
                <div style="background-color: #171a21; border: 1px solid #262b36; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff; font-family: monospace;">${otp}</span>
                </div>
                <p style="font-size: 12px; color: #9aa1b2;">Expires in 10 minutes. Delivered via Resend to ${fallbackRecipient}.</p>
              </div>
            `
          })

          if (!fallbackRes.error) {
            console.log(`[EMAIL DISPATCHED] Live email delivered to ${fallbackRecipient} (ID: ${fallbackRes.data?.id})`)
            return {
              success: true,
              provider: 'resend_forwarded',
              message: `Live email dispatched to ${fallbackRecipient} for student ${cleanEmail}`
            }
          }
        }

        console.warn(`[AutoSync OTP for ${cleanEmail}]: ${otp}\n`)
        return { success: true, provider: 'resend_sandbox', error: result.error.message }
      } else {
        console.log(`\n======================================================`)
        console.log(`[EMAIL DISPATCHED] Live OTP sent to ${cleanEmail} via Resend (ID: ${result.data?.id})`)
        console.log(`======================================================\n`)
        return { success: true, provider: 'resend' }
      }
    } catch (err: any) {
      console.warn('[Resend Exception]:', err.message)
    }
  }

  // 2. Try Nodemailer SMTP (e.g. Gmail App Password or College SMTP)
  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = process.env.SMTP_PASS?.trim()

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })

      await transporter.sendMail({
        from: `"AutoSync RVITM" <${smtpUser}>`,
        to: cleanEmail,
        subject,
        html: htmlContent
      })

      console.log(`[EMAIL DISPATCHED] OTP successfully sent to ${cleanEmail} via SMTP (${smtpUser})`)
      return { success: true, provider: 'smtp' }
    } catch (err: any) {
      console.warn('[SMTP Email Error]:', err.message)
    }
  }

  // 3. Fallback: Log to Server Console
  console.log(`\n======================================================`)
  console.log(`[LOCAL DEV DISPATCH] OTP for ${cleanEmail}: ${otp}`)
  console.log(`[TIP] Set RESEND_API_KEY or SMTP_USER/SMTP_PASS in .env.local to send live emails.`)
  console.log(`======================================================\n`)

  return { success: true, provider: 'console_fallback' }
}
