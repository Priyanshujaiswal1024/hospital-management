package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.dto.BloodGroupCountResponseEntity;
import com.priyanshu.hospitalmanagement.entity.Patient;
import com.priyanshu.hospitalmanagement.entity.type.BloodGroupType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    // ─────────────────────────────────────────────────────────────────────────
    // PRIMARY LOOKUPS
    // ─────────────────────────────────────────────────────────────────────────

    // Find by logged-in user's email (username field)
    Optional<Patient> findByUser_Username(String username);

    // findById(userId) works directly — Patient ID == User ID via @MapsId
    // NO NEED for findByUserId / findByUser_Id / findByUser — all REMOVED

    // ─────────────────────────────────────────────────────────────────────────
    // SEARCH
    // ─────────────────────────────────────────────────────────────────────────

    // FIX: Optional return — two patients can have same name
    Optional<Patient> findByName(String name);

    List<Patient> findByNameContainingOrderByIdDesc(String query);

    // FIX: removed findByBirthDateOrEmail — email no longer on Patient entity
    List<Patient> findByBirthDateBetween(LocalDate startDate, LocalDate endDate);

    // ─────────────────────────────────────────────────────────────────────────
    // BLOOD GROUP QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    @Query("SELECT p FROM Patient p WHERE p.bloodGroup = :bloodGroup")
    List<Patient> findByBloodGroup(@Param("bloodGroup") BloodGroupType bloodGroup);

    // Blood group stats for admin dashboard
    @Query("""
           SELECT new com.priyanshu.hospitalmanagement.dto.BloodGroupCountResponseEntity(
               p.bloodGroup, COUNT(p))
           FROM Patient p
           GROUP BY p.bloodGroup
           """)
    List<BloodGroupCountResponseEntity> countEachBloodGroupType();

    // ─────────────────────────────────────────────────────────────────────────
    // DATE QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    @Query("SELECT p FROM Patient p WHERE p.birthDate > :birthDate")
    List<Patient> findByBornAfterDate(@Param("birthDate") LocalDate birthDate);

    // ─────────────────────────────────────────────────────────────────────────
    // BULK / JOIN QUERIES
    // ─────────────────────────────────────────────────────────────────────────

    // FIX: replaced native "select * from patient" with JPQL
    // findAll(pageable) from JpaRepository does the same thing — but keeping
    // this in case you need it explicitly named somewhere
    @Query("SELECT p FROM Patient p")
    Page<Patient> findAllPatients(Pageable pageable);

    // Fetch patients with appointments in one query (avoids N+1)
    @Query("SELECT p FROM Patient p LEFT JOIN FETCH p.appointments")
    List<Patient> findAllPatientWithAppointment();

    // ─────────────────────────────────────────────────────────────────────────
    // BULK UPDATE
    // ─────────────────────────────────────────────────────────────────────────

    // FIX: @Transactional is now Spring's, not Jakarta's
    @Transactional
    @Modifying
    @Query("UPDATE Patient p SET p.name = :name WHERE p.id = :id")
    int updateNameWithId(@Param("name") String name, @Param("id") Long id);

    // ─────────────────────────────────────────────────────────────────────────
    // REMOVED — inherited from JpaRepository, no need to redeclare:
    // long count()
    //
    // REMOVED — broken after @MapsId, use findById(userId) instead:
    // Optional<Patient> findByUserId(Long userId)
    // Optional<Patient> findByUser_Id(Long userId)
    // Optional<Patient> findByUser(User user)
    // Optional<Patient> findByUserUsername(String username)
    // boolean existsByUser(User user)  → use existsById(userId) instead
    // ─────────────────────────────────────────────────────────────────────────
}