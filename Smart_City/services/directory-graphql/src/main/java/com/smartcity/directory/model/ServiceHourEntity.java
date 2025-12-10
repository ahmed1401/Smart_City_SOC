package com.smartcity.directory.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "directory_service_hours")
public class ServiceHourEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "service_id")
  private DirectoryServiceEntity service;

  @Column(name = "day_label")
  private String dayLabel;

  @Column(name = "open_time")
  private String openTime;

  @Column(name = "close_time")
  private String closeTime;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public DirectoryServiceEntity getService() {
    return service;
  }

  public void setService(DirectoryServiceEntity service) {
    this.service = service;
  }

  public String getDayLabel() {
    return dayLabel;
  }

  public void setDayLabel(String dayLabel) {
    this.dayLabel = dayLabel;
  }

  public String getOpenTime() {
    return openTime;
  }

  public void setOpenTime(String openTime) {
    this.openTime = openTime;
  }

  public String getCloseTime() {
    return closeTime;
  }

  public void setCloseTime(String closeTime) {
    this.closeTime = closeTime;
  }
}
