package com.smartcity.mobility.model;

import java.util.List;

public record Line(String id, String name, String mode, String status, List<Stop> stops) {
}
