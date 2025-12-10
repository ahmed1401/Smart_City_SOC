package com.smartcity.directory.model;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "directory_ticket")
public class DirectoryTicketEntity {

  @Id
  private String id;

  private String subject;

  private String description;

  @Enumerated(EnumType.STRING)
  private TicketStatus status;

  @Enumerated(EnumType.STRING)
  private TicketPriority priority;

  @Column(name = "created_at")
  private OffsetDateTime createdAt;

  @Column(name = "updated_at")
  private OffsetDateTime updatedAt;

  private String citizenId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "service_id")
  private DirectoryServiceEntity service;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

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

  public TicketStatus getStatus() {
    return status;
  }

  public void setStatus(TicketStatus status) {
    this.status = status;
  }

  public TicketPriority getPriority() {
    return priority;
  }

  public void setPriority(TicketPriority priority) {
    this.priority = priority;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public String getCitizenId() {
    return citizenId;
  }

  public void setCitizenId(String citizenId) {
    this.citizenId = citizenId;
  }

  public DirectoryServiceEntity getService() {
    return service;
  }

  public void setService(DirectoryServiceEntity service) {
    this.service = service;
  }
}
