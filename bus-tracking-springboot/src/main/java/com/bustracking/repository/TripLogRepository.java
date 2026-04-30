package com.bustracking.repository;

import com.bustracking.model.TripLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * TripLogRepository — Spring Data JPA handles all SQL automatically.
 *
 * Auto-generated SQL examples:
 *   findByBusId("BUS001") → SELECT * FROM trip_logs WHERE bus_id = 'BUS001'
 *   deleteByBusId(...)    → DELETE FROM trip_logs WHERE bus_id = ?
 */
@Repository
public interface TripLogRepository extends JpaRepository<TripLog, Long> {

    List<TripLog> findByBusIdOrderByTimestampAsc(String busId);

    void deleteByBusId(String busId);

    int countByBusId(String busId);
}
