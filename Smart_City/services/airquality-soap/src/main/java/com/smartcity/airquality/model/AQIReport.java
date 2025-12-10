package com.smartcity.airquality.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlType;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "AQIReport")
public class AQIReport {
  private String zoneCode;
  private int value;
  private String category;
  private String trend;
  private String recommendation;

  public String getZoneCode() {
    return zoneCode;
  }

  public void setZoneCode(String zoneCode) {
    this.zoneCode = zoneCode;
  }

  public int getValue() {
    return value;
  }

  public void setValue(int value) {
    this.value = value;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getTrend() {
    return trend;
  }

  public void setTrend(String trend) {
    this.trend = trend;
  }

  public String getRecommendation() {
    return recommendation;
  }

  public void setRecommendation(String recommendation) {
    this.recommendation = recommendation;
  }
}
