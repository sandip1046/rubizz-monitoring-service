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
exports.AlertModel = exports.AlertStatus = exports.AlertSeverity = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "LOW";
    AlertSeverity["MEDIUM"] = "MEDIUM";
    AlertSeverity["HIGH"] = "HIGH";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "ACTIVE";
    AlertStatus["RESOLVED"] = "RESOLVED";
    AlertStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    AlertStatus["SUPPRESSED"] = "SUPPRESSED";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
const AlertSchema = new mongoose_1.Schema({
    serviceName: {
        type: String,
        required: true,
        index: true,
    },
    alertType: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: Object.values(AlertSeverity),
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: Object.values(AlertStatus),
        default: AlertStatus.ACTIVE,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        default: null,
    },
    threshold: {
        type: Number,
        default: null,
    },
    labels: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    resolvedAt: {
        type: Date,
        default: null,
    },
    acknowledgedAt: {
        type: Date,
        default: null,
    },
    acknowledgedBy: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
    collection: 'alerts',
});
AlertSchema.index({ serviceName: 1, status: 1 });
AlertSchema.index({ serviceName: 1, severity: 1, status: 1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ serviceName: 1, alertType: 1, status: 1 });
exports.AlertModel = mongoose_1.default.model('Alert', AlertSchema);
//# sourceMappingURL=Alert.js.map