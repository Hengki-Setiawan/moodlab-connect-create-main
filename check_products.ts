import "dotenv/config";
import { db } from "./src/lib/turso";
import { products } from "./src/db/schema";

async function main() {
    try {
        console.log("Fetching products...");
        const allProducts = await db.select().from(products);
        console.log(`Found ${allProducts.length} products.`);
        allProducts.forEach(p => {
            console.log(`ID: ${p.id}, Name: ${p.name}, Type: ${p.type}`);
        });
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

main();
