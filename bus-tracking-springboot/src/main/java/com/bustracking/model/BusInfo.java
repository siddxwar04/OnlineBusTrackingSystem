package com.bustracking.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * BusInfo — response object for /data/view
 * This is NOT stored in MySQL. It is assembled from in-memory
 * bus state and returned to the React dashboard as JSON.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusInfo {
    private String  temp;
    private String  oil;
    private String  ticket;
    private String  latitude;
    private String  longitude;
    private String  seatCount;
    private String  mapUrl;
    private String  qrCodeUrl;
    private String  upiLink;
    private String  speed;
    private boolean tripActive;
    private String  tripStartTime;
    private int     logCount;
    private int     availableSeats;
    private int     totalSeats;
}
