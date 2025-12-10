package com.smartcity.directory.graphql.dto;

import com.smartcity.directory.model.TicketPriority;
import com.smartcity.directory.model.TicketStatus;

public record TicketDto(
    String id,
    String subject,
    String description,
    TicketStatus status,
    TicketPriority priority,
    String createdAt,
    String updatedAt,
    String citizenId,
    ServiceDto service
) {}
