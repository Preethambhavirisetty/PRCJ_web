import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}
export function getDiscountPercent(price, salePrice) {
    return Math.round(((price - salePrice) / price) * 100);
}
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
export function truncate(text, length) {
    if (text.length <= length)
        return text;
    return text.slice(0, length).trimEnd() + '…';
}
export function getImageUrl(product) {
    if (!product.images?.length)
        return '/images/placeholder-jewelry.jpg';
    const primary = product.images.find((img) => img.is_primary) ?? product.images[0];
    return primary.medium_url ?? primary.url;
}
export function getThumbUrl(product) {
    if (!product.images?.length)
        return '/images/placeholder-jewelry.jpg';
    const primary = product.images.find((img) => img.is_primary) ?? product.images[0];
    return primary.thumbnail_url ?? primary.url;
}
export function formatDate(dateStr) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(dateStr));
}
export function getStarArray(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (rating >= i)
            stars.push('full');
        else if (rating >= i - 0.5)
            stars.push('half');
        else
            stars.push('empty');
    }
    return stars;
}
export function getOrderStatusColor(status) {
    const map = {
        pending: 'bg-yellow-100 text-yellow-700',
        confirmed: 'bg-blue-100 text-blue-700',
        processing: 'bg-indigo-100 text-indigo-700',
        shipped: 'bg-purple-100 text-purple-700',
        delivered: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700',
        refunded: 'bg-gray-100 text-gray-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
}
