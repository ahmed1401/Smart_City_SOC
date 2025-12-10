package com.smartcity.directory.graphql.input;

public class ServiceFilterInput {

  private String category;
  private String text;
  private String nearZone;

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = text;
  }

  public String getNearZone() {
    return nearZone;
  }

  public void setNearZone(String nearZone) {
    this.nearZone = nearZone;
  }
}
