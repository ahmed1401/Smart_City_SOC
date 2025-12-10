package com.smartcity.mobility.model;

import java.time.OffsetDateTime;

public record Booking(
    String id,
    String lineId,
    String stopFrom,
    String stopTo,
    OffsetDateTime datetime,
    String userId,
    String status
) {
}
