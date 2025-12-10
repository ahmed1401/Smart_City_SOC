package com.smartcity.emergency.model;

import java.time.Instant;

public class AlertRecord {
    private final String id;
    private final String type;
    private final String zone;
    private final String description;
    private final Instant eventTimestamp;
    private final AlertSeverity severity;
    private final String source;
    private final boolean acknowledged;
    private final Instant createdAt;

    public AlertRecord(String id,
                                         String type,
                                         String zone,
                                         String description,
                                         Instant eventTimestamp,
                                         AlertSeverity severity,
                                         String source,
                                         boolean acknowledged,
                                         Instant createdAt) {
        this.id = id;
        this.type = type;
        this.zone = zone;
        this.description = description;
        this.eventTimestamp = eventTimestamp;
        this.severity = severity;
        this.source = source;
        this.acknowledged = acknowledged;
        this.createdAt = createdAt;
    }

    public String id() {
        return id;
    }

    public String type() {
        return type;
    }

    public String zone() {
        return zone;
    }

    public String description() {
        return description;
    }

    public Instant eventTimestamp() {
        return eventTimestamp;
    }

    public AlertSeverity severity() {
        return severity;
    }

    public String source() {
        return source;
    }

    public boolean acknowledged() {
        return acknowledged;
    }

    public Instant createdAt() {
        return createdAt;
    }
}
