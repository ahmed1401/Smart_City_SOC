package com.smartcity.directory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.smartcity.directory.model.DirectoryServiceEntity;

public interface DirectoryServiceRepository extends JpaRepository<DirectoryServiceEntity, String> {

  @EntityGraph(attributePaths = "hours")
  @Query("select s from DirectoryServiceEntity s")
  List<DirectoryServiceEntity> findAllWithHours();

  @EntityGraph(attributePaths = "hours")
  @Query("select s from DirectoryServiceEntity s where s.id = :id")
  java.util.Optional<DirectoryServiceEntity> findByIdWithHours(String id);
}
