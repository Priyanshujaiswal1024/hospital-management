package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}