
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@libsql/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification = await req.json();
    console.log("Received Midtrans webhook:", JSON.stringify(notification));

    const tursoUrl = Deno.env.get("TURSO_DATABASE_URL");
    const tursoToken = Deno.env.get("TURSO_AUTH_TOKEN");

    if (!tursoUrl || !tursoToken) {
      throw new Error("Missing Turso configuration");
    }

    const db = createClient({
      url: tursoUrl.replace("libsql://", "https://"),
      authToken: tursoToken,
    });

    const {
      order_id,
      transaction_status,
      transaction_id,
      payment_type,
      fraud_status,
    } = notification;

    let orderStatus = "pending";

    if (transaction_status === "capture") {
      if (fraud_status === "accept") {
        orderStatus = "paid";
      }
    } else if (transaction_status === "settlement") {
      orderStatus = "paid";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      orderStatus = "failed";
    } else if (transaction_status === "pending") {
      orderStatus = "pending";
    }

    console.log(`Updating order ${order_id} to status: ${orderStatus}`);

    // Update order status in Turso
    // Using simple SQL execution since we don't have schema/drizzle in Edge Function easily
    // Ensure order_id is treated as integer if schema uses integer PK
    const orderIdInt = parseInt(order_id);

    if (isNaN(orderIdInt)) {
      console.error("Invalid order ID format:", order_id);
      return new Response(
        JSON.stringify({ error: "Invalid order ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await db.execute({
      sql: "UPDATE orders SET status = ?, midtrans_transaction_id = ?, payment_type = ? WHERE id = ?",
      args: [orderStatus, transaction_id || null, payment_type || null, orderIdInt]
    });

    console.log(`Order ${order_id} updated successfully`);

    // We don't need to insert into user_product_access because Profile.tsx reads directly from paid orders.

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in midtrans-webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
