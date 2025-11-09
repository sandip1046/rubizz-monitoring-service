"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertCondition = exports.MonitoringEventType = void 0;
var MonitoringEventType;
(function (MonitoringEventType) {
    MonitoringEventType["SERVICE_HEALTH_CHANGED"] = "service.health.changed";
    MonitoringEventType["ALERT_CREATED"] = "alert.created";
    MonitoringEventType["ALERT_RESOLVED"] = "alert.resolved";
    MonitoringEventType["METRIC_COLLECTED"] = "metric.collected";
    MonitoringEventType["SERVICE_REGISTERED"] = "service.registered";
    MonitoringEventType["SERVICE_DEREGISTERED"] = "service.deregistered";
    MonitoringEventType["DASHBOARD_CREATED"] = "dashboard.created";
    MonitoringEventType["DASHBOARD_UPDATED"] = "dashboard.updated";
})(MonitoringEventType || (exports.MonitoringEventType = MonitoringEventType = {}));
var AlertCondition;
(function (AlertCondition) {
    AlertCondition["GREATER_THAN"] = ">";
    AlertCondition["LESS_THAN"] = "<";
    AlertCondition["GREATER_THAN_OR_EQUAL"] = ">=";
    AlertCondition["LESS_THAN_OR_EQUAL"] = "<=";
    AlertCondition["EQUAL"] = "==";
    AlertCondition["NOT_EQUAL"] = "!=";
    AlertCondition["CONTAINS"] = "contains";
    AlertCondition["NOT_CONTAINS"] = "not_contains";
    AlertCondition["REGEX_MATCH"] = "regex_match";
})(AlertCondition || (exports.AlertCondition = AlertCondition = {}));
//# sourceMappingURL=monitoring.types.js.map