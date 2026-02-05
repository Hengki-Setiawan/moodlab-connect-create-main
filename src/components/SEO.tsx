import { Helmet } from "react-helmet-async";

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: "website" | "product" | "article";
    product?: {
        name: string;
        price: number;
        image?: string;
        description?: string;
    };
}

const SEO = ({ title, description, image, url, type = "website", product }: SEOProps) => {
    const siteTitle = "Moodlab - Solusi Marketing Instan & Aset Digital";
    const defaultDescription = "Temukan moodmu untuk upgrade bisnis kamu. Produk digital, template, dan jasa marketing siap pakai untuk UMKM Indonesia.";
    const defaultImage = "/og-image.png";
    const siteUrl = "https://moodlab.id";

    const fullTitle = `${title} | Moodlab`;

    // Organization structured data
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Moodlab",
        "url": siteUrl,
        "logo": `${siteUrl}/logo.png`,
        "description": defaultDescription,
        "sameAs": [
            "https://instagram.com/moodlab.id",
            "https://twitter.com/moodlab"
        ]
    };

    // Product structured data (if product prop is provided)
    const productSchema = product ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description || "",
        "image": product.image || defaultImage,
        "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "IDR",
            "availability": "https://schema.org/InStock"
        }
    } : null;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <link rel="canonical" href={url || siteUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url || siteUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={image || defaultImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url || siteUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description || defaultDescription} />
            <meta property="twitter:image" content={image || defaultImage} />

            {/* Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(organizationSchema)}
            </script>
            {productSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(productSchema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;

