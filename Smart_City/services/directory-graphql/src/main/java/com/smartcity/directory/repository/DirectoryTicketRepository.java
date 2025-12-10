package com.smartcity.directory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.smartcity.directory.model.DirectoryTicketEntity;

public interface DirectoryTicketRepository extends JpaRepository<DirectoryTicketEntity, String> {

  @EntityGraph(attributePaths = {"service", "service.hours"})
  List<DirectoryTicketEntity> findAllByOrderByUpdatedAtDesc();

  @EntityGraph(attributePaths = {"service", "service.hours"})
  java.util.Optional<DirectoryTicketEntity> findById(String id);
}
