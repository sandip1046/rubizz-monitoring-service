"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMetricModel = exports.MetricType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "COUNTER";
    MetricType["GAUGE"] = "GAUGE";
    MetricType["HISTOGRAM"] = "HISTOGRAM";
    MetricType["SUMMARY"] = "SUMMARY";
})(MetricType || (exports.MetricType = MetricType = {}));
const SystemMetricSchema = new mongoose_1.Schema({
    serviceName: {
        type: String,
        required: true,
        index: true,
    },
    metricName: {
        type: String,
        required: true,
        index: true,
    },
    metricType: {
        type: String,
        enum: Object.values(MetricType),
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    labels: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true,
    collection: 'system_metrics',
});
SystemMetricSchema.index({ serviceName: 1, metricName: 1, timestamp: -1 });
SystemMetricSchema.index({ serviceName: 1, timestamp: -1 });
SystemMetricSchema.index({ metricName: 1, timestamp: -1 });
SystemMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });
exports.SystemMetricModel = mongoose_1.default.model('SystemMetric', SystemMetricSchema);
//# sourceMappingURL=SystemMetric.js.map