module.exports = {
    ifCond: function(v1, v2, options) {
        if (v1 === v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    },
    calcDiscountedPrice: function(price, discount) {
        return price - (price * (discount / 100));
    },
    add: function (value1, value2) {
        return value1 + value2;
    },
    subtract: function (value1, value2) {
        return value1 - value2;
    },
    eq: function (value1, value2) {
        return value1 === value2;
    },
    gt: function (value1, value2) {
        return value1 > value2;
    },
    lt: function (value1, value2) {
        return value1 < value2;
    },
    range: function (start, end) {
        return Array.from({ length: end - start + 1 }, (_, i) => i + start);
    }
};