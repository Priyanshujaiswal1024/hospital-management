// EmailEvent.java — base class
package com.priyanshu.hospitalmanagement.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailEvent {
    private String type;       // EVENT_TYPE identify karne ke liye
    private String toEmail;
}