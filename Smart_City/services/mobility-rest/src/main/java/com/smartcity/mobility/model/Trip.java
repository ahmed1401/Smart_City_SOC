package com.smartcity.mobility.model;

import java.time.OffsetDateTime;
import java.util.List;

public record Trip(OffsetDateTime departure, OffsetDateTime arrival, List<StopTime> stops) {
}
