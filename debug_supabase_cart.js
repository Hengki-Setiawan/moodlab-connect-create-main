import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Use publishable key for client-side emulation

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("Checking Supabase products...");
    const { data: products, error: prodError } = await supabase.from('products').select('*').limit(5);
    if (prodError) console.error("Error fetching products:", prodError);
    else console.log("Supabase Products:", products);

    console.log("\nChecking Supabase cart_items...");
    const { data: cart, error: cartError } = await supabase.from('cart_items').select('*').limit(5);
    if (cartError) console.error("Error fetching cart:", cartError);
    else console.log("Cart Items:", cart);

    // Try to insert a dummy item to see the error detail
    console.log("\nAttempting dummy insert...");
    // We need a valid user ID. Let's try to sign in or use a hardcoded one if we can find one in cart.
    let userId = cart && cart.length > 0 ? cart[0].user_id : null;

    if (!userId) {
        console.log("No user found in cart to test with. Skipping insert test.");
        return;
    }

    const { error: insertError } = await supabase.from('cart_items').insert({
        user_id: userId,
        product_id: "999999", // Test integer string
        quantity: 1
    });

    if (insertError) {
        console.error("Insert failed:", insertError);
    } else {
        console.log("Insert success!");
    }
}

debug();
