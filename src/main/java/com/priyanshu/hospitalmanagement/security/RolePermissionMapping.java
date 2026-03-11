package com.priyanshu.hospitalmanagement.security;

import com.priyanshu.hospitalmanagement.entity.type.PermissionType;
import com.priyanshu.hospitalmanagement.entity.type.RoleType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.priyanshu.hospitalmanagement.entity.type.PermissionType.*;
import static com.priyanshu.hospitalmanagement.entity.type.RoleType.*;

public class RolePermissionMapping {

    private static final Map<RoleType, Set<PermissionType>> ROLE_PERMISSION_MAP = Map.of(

            PATIENT, Set.of(
                    PATIENT_READ,
                    APPOINTMENT_READ,
                    APPOINTMENT_WRITE
            ),

            DOCTOR, Set.of(
                    APPOINTMENT_DELETE,
                    APPOINTMENT_WRITE,
                    APPOINTMENT_READ,
                    PATIENT_READ
            ),

            ADMIN, Set.of(
                    PATIENT_READ,
                    PATIENT_WRITE,
                    APPOINTMENT_READ,
                    APPOINTMENT_WRITE,
                    APPOINTMENT_DELETE,
                    USER_MANAGE,
                    REPORT_VIEW
            )
    );

    public static Set<SimpleGrantedAuthority> getAuthoritiesForRole(RoleType role) {

        Set<PermissionType> permissions = ROLE_PERMISSION_MAP.get(role);

        if (permissions == null) {
            return Set.of();
        }

        return permissions.stream()
                .map(permission ->
                        new SimpleGrantedAuthority(permission.getPermission()))
                .collect(Collectors.toSet());
    }
}