var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ACCURATE_SCHEMA = {};
ACCURATE_SCHEMA.ACCURATE = {
    id: { type: String },
    created: String,
    eventType: String,
    environment: String,
    test: Boolean,
    eventInfo: {
        orderId: { type: Schema.ObjectId },
        orderStatus: String,
        orderResult: String,
        percentageComplete: Number,
        referenceCodes: []
    }
};
module.exports = ACCURATE_SCHEMA;
