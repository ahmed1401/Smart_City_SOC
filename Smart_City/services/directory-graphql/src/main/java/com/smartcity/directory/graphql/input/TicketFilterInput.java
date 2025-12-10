package com.smartcity.directory.graphql.input;

import com.smartcity.directory.model.TicketStatus;

public class TicketFilterInput {

  private TicketStatus status;
  private String serviceId;
  private String citizenId;

  public TicketStatus getStatus() {
    return status;
  }

  public void setStatus(TicketStatus status) {
    this.status = status;
  }

  public String getServiceId() {
    return serviceId;
  }

  public void setServiceId(String serviceId) {
    this.serviceId = serviceId;
  }

  public String getCitizenId() {
    return citizenId;
  }

  public void setCitizenId(String citizenId) {
    this.citizenId = citizenId;
  }
}
