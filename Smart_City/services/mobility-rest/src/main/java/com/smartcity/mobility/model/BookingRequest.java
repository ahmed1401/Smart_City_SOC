package com.smartcity.mobility.model;

import java.time.OffsetDateTime;

import jakarta.validation.constraints.NotBlank;

public record BookingRequest(
    @NotBlank String lineId,
    @NotBlank String stopFrom,
    @NotBlank String stopTo,
    OffsetDateTime datetime,
    @NotBlank String userId
) {
}
