package com.priyanshu.hospitalmanagement.dto;

import com.priyanshu.hospitalmanagement.entity.type.BloodGroupType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class BloodGroupCountResponseEntity {

    private BloodGroupType bloodGroupType;
    private Long count;
}
