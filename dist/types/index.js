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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricType = exports.AlertStatus = exports.AlertSeverity = exports.ServiceStatus = void 0;
var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["HEALTHY"] = "HEALTHY";
    ServiceStatus["UNHEALTHY"] = "UNHEALTHY";
    ServiceStatus["DEGRADED"] = "DEGRADED";
    ServiceStatus["UNKNOWN"] = "UNKNOWN";
    ServiceStatus["MAINTENANCE"] = "MAINTENANCE";
})(ServiceStatus || (exports.ServiceStatus = ServiceStatus = {}));
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
var MetricType;
(function (MetricType) {
    MetricType["COUNTER"] = "COUNTER";
    MetricType["GAUGE"] = "GAUGE";
    MetricType["HISTOGRAM"] = "HISTOGRAM";
    MetricType["SUMMARY"] = "SUMMARY";
})(MetricType || (exports.MetricType = MetricType = {}));
__exportStar(require("./monitoring.types"), exports);
__exportStar(require("./api.types"), exports);
__exportStar(require("./metrics.types"), exports);
//# sourceMappingURL=index.js.map