package com.smartcity.mobility.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartcity.mobility.entity.BookingEntity;

public interface BookingJpaRepository extends JpaRepository<BookingEntity, String> {
  List<BookingEntity> findByUserIdIgnoreCaseOrderByDatetimeDesc(String userId);

  List<BookingEntity> findAllByOrderByDatetimeDesc();
}
