package com.smartcity.mobility.model;

import java.time.LocalDate;
import java.util.List;

public record Schedule(String lineId, LocalDate date, List<Trip> trips) {
}
