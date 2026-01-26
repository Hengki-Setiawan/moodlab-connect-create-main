// GA4 Event Tracking Utilities
// Uses react-ga4 which is already installed

import ReactGA from 'react-ga4';

let isGAInitialized = false;

// Initialize GA4 (call this once in App.tsx or main.tsx)
export const initGA = () => {
    try {
        const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
        if (measurementId && measurementId !== 'undefined') {
            ReactGA.initialize(measurementId);
            isGAInitialized = true;
            console.log('GA4 Initialized');
        } else {
            console.warn('GA4 Measurement ID not found in environment variables');
        }
    } catch (error) {
        console.error('GA4 initialization error:', error);
    }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
    if (!isGAInitialized) return;
    try {
        ReactGA.send({
            hitType: 'pageview',
            page: path,
            title: title || document.title
        });
    } catch (error) {
        console.error('GA4 trackPageView error:', error);
    }
};

// E-commerce Events
export const trackViewItem = (product: {
    id: string | number;
    name: string;
    price: number;
    category?: string;
}) => {
    ReactGA.event('view_item', {
        currency: 'IDR',
        value: product.price,
        items: [{
            item_id: String(product.id),
            item_name: product.name,
            item_category: product.category || 'general',
            price: product.price,
            quantity: 1
        }]
    });
};

export const trackAddToCart = (product: {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    category?: string;
}) => {
    ReactGA.event('add_to_cart', {
        currency: 'IDR',
        value: product.price * product.quantity,
        items: [{
            item_id: String(product.id),
            item_name: product.name,
            item_category: product.category || 'general',
            price: product.price,
            quantity: product.quantity
        }]
    });
};

export const trackRemoveFromCart = (product: {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
}) => {
    ReactGA.event('remove_from_cart', {
        currency: 'IDR',
        value: product.price * product.quantity,
        items: [{
            item_id: String(product.id),
            item_name: product.name,
            price: product.price,
            quantity: product.quantity
        }]
    });
};

export const trackBeginCheckout = (items: Array<{
    id: string | number;
    name: string;
    price: number;
    quantity: number;
}>, total: number) => {
    ReactGA.event('begin_checkout', {
        currency: 'IDR',
        value: total,
        items: items.map(item => ({
            item_id: String(item.id),
            item_name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    });
};

export const trackPurchase = (orderId: string, items: Array<{
    id: string | number;
    name: string;
    price: number;
    quantity: number;
}>, total: number) => {
    ReactGA.event('purchase', {
        transaction_id: orderId,
        currency: 'IDR',
        value: total,
        items: items.map(item => ({
            item_id: String(item.id),
            item_name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    });
};

// Custom Events
export const trackSignUp = (method: string = 'email') => {
    ReactGA.event('sign_up', { method });
};

export const trackLogin = (method: string = 'email') => {
    ReactGA.event('login', { method });
};

export const trackSearch = (searchTerm: string) => {
    ReactGA.event('search', { search_term: searchTerm });
};

export const trackShare = (contentType: string, itemId: string) => {
    ReactGA.event('share', {
        content_type: contentType,
        item_id: itemId
    });
};

// Generic event tracker
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
    ReactGA.event(eventName, params);
};
