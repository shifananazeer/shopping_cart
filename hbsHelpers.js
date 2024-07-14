const moment = require('moment');

module.exports = {
    ifCond: function(v1, operator, v2, options) {
        if (v1 && v1.toString) v1 = v1.toString();
        if (v2 && v2.toString) v2 = v2.toString();

        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    },
    calcDiscountedPrice: function(price, discount) {
        price = parseFloat(price);
        discount = parseFloat(discount);

        let discountedPrice = price - (price * (discount / 100));
        return Math.round(discountedPrice);
    },
    add: function(value1, value2) {
        return value1 + value2;
    },
    subtract: function(value1, value2) {
        return value1 - value2;
    },
    eq: function(value1, value2) {
        return value1 === value2;
    },
    gt: function(value1, value2) {
        return value1 > value2;
    },
    lt: function(value1, value2) {
        return value1 < value2;
    },
    range: function(start, end) {
        return Array.from({ length: end - start + 1 }, (_, i) => i + start);
    },
    generateStars: function(rating) {
        let starsHtml = '';
        const filledStars = Math.floor(rating);
        const remainder = rating - filledStars;

        for (let i = 0; i < filledStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }

        if (remainder > 0.25) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }

        return starsHtml;
    },
    indexPlusOne: function(index) {
        return index + 1;
    },
    stringifyItems: function(items) {
        return JSON.stringify(items);
    },
    stringifySummary: function(summary) {
        return JSON.stringify(summary);
    },
    formatDate: function(date) {
        return moment(date).format('MMMM Do YYYY, h:mm:ss a');
    },
    isUserPurchased: function(userId, productId, orders) {
        if (!Array.isArray(orders)) {
            return false;
        }

        return orders.some(order =>
            order.status === 'Delivered' &&
            order.items.some(item => 
                item.productId.toString() === productId.toString()
            )
        );
    },
    productsPrev: function(currentPage) {
        return currentPage > 1;
    },
    productsNext: function(currentPage, totalPages) {
        return currentPage < totalPages;
    },
    includes: function(array, id) {
        if (!Array.isArray(array)) return false; 
        return array.includes(id);
    },
    contains: function(item, list, options) {
        if (list.includes(item.toString())) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    }
};
