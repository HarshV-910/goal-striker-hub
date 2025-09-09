import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  otp: string;
  type: 'signup' | 'reset';
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, type, name }: OTPEmailRequest = await req.json();

    const emailTemplate = type === 'signup' 
      ? {
          subject: "Verify Your Email - Striker",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
              <div style="background: linear-gradient(135deg, #3b82f6, #93c5fd); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: white; font-size: 28px; margin: 0;">Welcome to Striker!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your goal tracking journey starts here</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                ${name ? `<p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi ${name},</p>` : ''}
                <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                  Thank you for signing up! Please verify your email address by entering the following code:
                </p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                  <div style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 4px; font-family: monospace;">
                    ${otp}
                  </div>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                  This code will expire in 10 minutes for security purposes.
                </p>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                  If you didn't create an account with Striker, please ignore this email.
                </p>
              </div>
              
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
                © 2025 Striker. All rights reserved.
              </p>
            </div>
          `,
        }
      : {
          subject: "Reset Your Password - Striker",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
              <div style="background: linear-gradient(135deg, #ef4444, #f87171); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: white; font-size: 28px; margin: 0;">Password Reset</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Secure your Striker account</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                  You requested to reset your password for your Striker account. Enter the following code to proceed:
                </p>
                
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px solid #fecaca;">
                  <div style="font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 4px; font-family: monospace;">
                    ${otp}
                  </div>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                  This code will expire in 10 minutes for security purposes.
                </p>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                  If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                </p>
              </div>
              
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
                © 2025 Striker. All rights reserved.
              </p>
            </div>
          `,
        };

    const emailResponse = await resend.emails.send({
      from: "Striker <onboarding@resend.dev>",
      to: [email],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);