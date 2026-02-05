import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { body } = await req.json();
        const { type, orderId, customer, services } = body;

        console.log(`[Email Service] Sending email for ${type} order #${orderId}`);
        console.log(`To: ${customer.contact_email}`);
        console.log(`Data:`, JSON.stringify(body, null, 2));

        // TODO: Integrate with Resend or SMTP here
        // Example:
        // await resend.emails.send({ ... })

        return new Response(
            JSON.stringify({ success: true, message: "Email queued (Mock)" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error sending email:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
