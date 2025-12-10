package com.smartcity.airquality.model;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlType;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "PollutantLevel")
public class PollutantLevel {
  private String name;
  private double value;
  private String unit;

  public PollutantLevel() {
  }

  public PollutantLevel(String name, double value, String unit) {
    this.name = name;
    this.value = value;
    this.unit = unit;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public double getValue() {
    return value;
  }

  public void setValue(double value) {
    this.value = value;
  }

  public String getUnit() {
    return unit;
  }

  public void setUnit(String unit) {
    this.unit = unit;
  }
}
