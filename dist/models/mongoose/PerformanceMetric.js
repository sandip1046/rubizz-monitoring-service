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
exports.PerformanceMetricModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PerformanceMetricSchema = new mongoose_1.Schema({
    serviceName: {
        type: String,
        required: true,
        index: true,
    },
    endpoint: {
        type: String,
        required: true,
        index: true,
    },
    method: {
        type: String,
        required: true,
    },
    responseTime: {
        type: Number,
        required: true,
    },
    statusCode: {
        type: Number,
        required: true,
    },
    requestSize: {
        type: Number,
        default: null,
    },
    responseSize: {
        type: Number,
        default: null,
    },
    userAgent: {
        type: String,
        default: null,
    },
    ipAddress: {
        type: String,
        default: null,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true,
    collection: 'performance_metrics',
});
PerformanceMetricSchema.index({ serviceName: 1, endpoint: 1, timestamp: -1 });
PerformanceMetricSchema.index({ serviceName: 1, timestamp: -1 });
PerformanceMetricSchema.index({ endpoint: 1, timestamp: -1 });
PerformanceMetricSchema.index({ statusCode: 1, timestamp: -1 });
PerformanceMetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });
exports.PerformanceMetricModel = mongoose_1.default.model('PerformanceMetric', PerformanceMetricSchema);
//# sourceMappingURL=PerformanceMetric.js.map