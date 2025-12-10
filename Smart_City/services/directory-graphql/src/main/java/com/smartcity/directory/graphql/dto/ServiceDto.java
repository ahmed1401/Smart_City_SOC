package com.smartcity.directory.graphql.dto;

import java.util.List;

public record ServiceDto(
    String id,
    String name,
    String category,
    String description,
    ContactInfoDto contact,
    List<OpeningHourDto> hours,
    LocationDto location,
    AqiInsightDto relatedAQI
) {}
