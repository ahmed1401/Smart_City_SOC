package com.smartcity.mobility.model;

import java.time.OffsetDateTime;

public record StopTime(String stopId, OffsetDateTime time) {
}
