import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: orderStatus,
        midtrans_transaction_id: transaction_id,
        payment_type: payment_type,
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    // If payment is successful, grant access to digital products
    if (orderStatus === "paid") {
      console.log(`Payment successful for order ${order_id}, granting product access`);

      // Get order items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("order_id", order_id);

      if (itemsError) {
        console.error("Error fetching order items:", itemsError);
        throw itemsError;
      }

      // Get user_id from order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("user_id")
        .eq("id", order_id)
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
        throw orderError;
      }

      // Grant access to all purchased products
      const accessRecords = orderItems.map((item) => ({
        user_id: orderData.user_id,
        product_id: item.product_id,
        order_id: order_id,
      }));

      const { error: accessError } = await supabase
        .from("user_product_access")
        .insert(accessRecords);

      if (accessError) {
        console.error("Error granting product access:", accessError);
        throw accessError;
      }

      console.log(`Granted access to ${accessRecords.length} products`);
    }

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
