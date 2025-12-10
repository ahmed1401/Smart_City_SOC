package com.smartcity.airquality;

import jakarta.xml.ws.Endpoint;

public class AirQualityApplication {
  public static void main(String[] args) {
    String address = System.getenv().getOrDefault("SOAP_BIND_ADDRESS", "http://0.0.0.0:8081/airquality");
    Endpoint.publish(address, new AirQualityServiceImpl());
    System.out.printf("AirQuality SOAP service started at %s%n", address);
  }
}
