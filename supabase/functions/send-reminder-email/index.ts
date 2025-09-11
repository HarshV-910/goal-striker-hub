import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  email: string;
  goalTitle: string;
  deadline: string;
  reminderType: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, goalTitle, deadline, reminderType, userName }: ReminderEmailRequest = await req.json();

    const reminderLabels: { [key: string]: string } = {
      '15min': '15 minutes',
      '30min': '30 minutes', 
      '1hour': '1 hour',
      '1day': '1 day',
      '3days': '3 days',
      '7days': '7 days',
      '1month': '1 month',
      '3months': '3 months'
    };

    const emailResponse = await resend.emails.send({
      from: "Striker Reminders <onboarding@resend.dev>",
      to: [email],
      subject: `Goal Reminder: ${goalTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #8b5cf6, #a78bfa); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; font-size: 28px; margin: 0;">🎯 Goal Reminder</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Stay focused on your objectives</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            ${userName ? `<p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hi ${userName},</p>` : ''}
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
              <h2 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">
                ${goalTitle}
              </h2>
              <p style="color: #1f2937; margin: 0; font-size: 14px;">
                Deadline: <strong>${new Date(deadline).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</strong>
              </p>
            </div>
            
            <p style="font-size: 16px; color: #374151; line-height: 1.6;">
              This is your <strong>${reminderLabels[reminderType]}</strong> reminder for the goal above.
              Time to take action and move closer to achieving your objective!
            </p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/goals" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                View Your Goals
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Keep pushing forward! Every small step counts towards your success.
            </p>
          </div>
          
          <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
            © 2025 Striker. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log("Reminder email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reminder-email function:", error);
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