package com.smartcity.directory.graphql.input;

import com.smartcity.directory.model.TicketPriority;
import jakarta.validation.constraints.NotBlank;

public class TicketInput {

  @NotBlank
  private String subject;

  @NotBlank
  private String description;

  @NotBlank
  private String serviceId;

  private TicketPriority priority = TicketPriority.MEDIUM;

  @NotBlank
  private String citizenId;

  public String getSubject() {
    return subject;
  }

  public void setSubject(String subject) {
    this.subject = subject;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getServiceId() {
    return serviceId;
  }

  public void setServiceId(String serviceId) {
    this.serviceId = serviceId;
  }

  public TicketPriority getPriority() {
    return priority;
  }

  public void setPriority(TicketPriority priority) {
    this.priority = priority;
  }

  public String getCitizenId() {
    return citizenId;
  }

  public void setCitizenId(String citizenId) {
    this.citizenId = citizenId;
  }
}
