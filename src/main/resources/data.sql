# INSERT INTO patient (name, gender, birth_date, email, blood_group)
# VALUES
#     ('Aarav Sharma', 'MALE', '1990-05-10', 'aarav.sharma@example.com', 'O_POSITIVE'),
#     ('Diya Patel', 'FEMALE', '1995-08-20', 'diya.patel@example.com', 'A_POSITIVE'),
#     ('Dishant Verma', 'MALE', '1988-03-15', 'dishant.verma@example.com', 'A_POSITIVE'),
#     ('Neha Iyer', 'FEMALE', '1992-12-01', 'neha.iyer@example.com', 'AB_POSITIVE'),
#     ('Kabir Singh', 'MALE', '1993-07-11', 'kabir.singh@example.com', 'O_POSITIVE');
#
# INSERT INTO doctor (name, specialization, email)
# VALUES
#     ('Dr. Rakesh Mehta', 'Cardiology', 'rakesh.mehta@example.com'),
#     ('Dr. Sneha Kapoor', 'Dermatology', 'sneha.kapoor@example.com'),
#     ('Dr. Arjun Nair', 'Orthopedics', 'arjun.nair@example.com');
#
# INSERT INTO appointment (appointment_time, reason, doctor_id, patient_id)
# VALUES
#   ('2025-07-01 10:30:00', 'General Checkup', 1, 2),
#   ('2025-07-02 11:00:00', 'Skin Rash', 2, 2),
#   ('2025-07-03 09:45:00', 'Knee Pain', 3, 3),
#   ('2025-07-04 14:00:00', 'Follow-up Visit', 1, 1),
#   ('2025-07-05 16:15:00', 'Consultation', 1, 4),
# #   ('2025-07-06 08:30:00', 'Allergy Treatment', 2, 5);
#
# USE hospitaldb;
#
# SET FOREIGN_KEY_CHECKS = 0;
# DROP TABLE IF EXISTS appointment, my_dpt_doctors, department, doctor, app_user;
# SET FOREIGN_KEY_CHECKS = 1;
# INSERT INTO department (name) VALUES ('General Medicine');
# INSERT INTO department (name) VALUES ('Cardiology');
# INSERT INTO department (name) VALUES ('Neurology');
# INSERT INTO department (name) VALUES ('Orthopedics');
# INSERT INTO department (name) VALUES ('Pediatrics');
# INSERT INTO department (name) VALUES ('Gynecology');
# INSERT INTO department (name) VALUES ('Dermatology');
# INSERT INTO department (name) VALUES ('Ophthalmology');
# INSERT INTO department (name) VALUES ('ENT');
# INSERT INTO department (name) VALUES ('Urology');
# INSERT INTO department (name) VALUES ('Nephrology');
# INSERT INTO department (name) VALUES ('Gastroenterology');
# INSERT INTO department (name) VALUES ('Oncology');
# INSERT INTO department (name) VALUES ('Endocrinology');
# INSERT INTO department (name) VALUES ('Pulmonology');
# INSERT INTO department (name) VALUES ('Psychiatry');z
# INSERT INTO department (name) VALUES ('Radiology');
# INSERT INTO department (name) VALUES ('Pathology');
# INSERT INTO department (name) VALUES ('Emergency Medicine');
# INSERT INTO department (name) VALUES ('Anesthesiology');
# DROP TABLE IF EXISTS departsment_doctors;
select *
from patient;
select *
from app_user;
select *
from user_roles;
select *
from insurance;
select *
from prescription;
select *
from appointment;
select *
from department;
select *
from doctor_availability;
select *
from department_doctors;
select *
from doctor;
