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

    // Calculate the discounted price
    let discountedPrice = price - (price * (discount / 100));
    
    // Round to the nearest whole number and return
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
        const filledStars = Math.floor(rating); // Number of filled stars
        const remainder = rating - filledStars; // Remaining fraction for half star

        // Add filled stars
        for (let i = 0; i < filledStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }

        // Add half star if remainder is more than 0.25
        if (remainder > 0.25) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }

        // Add empty stars to complete 5 stars
        const emptyStars = 5 - Math.ceil(rating); // Remaining empty stars
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

    isUserPurchased: (userId, productId, orders) => {
        if (!Array.isArray(orders)) {
            return false;
        }
    
        return orders.some(order =>
            order.status === 'Delivered' &&
            order.items.some(item => 
                item.productId.toString() === productId.toString()
            )
        )
}
}
