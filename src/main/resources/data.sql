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
# INSERT INTO department (name) VALUES ('Cardiology');
# INSERT INTO department (name) VALUES ('General Medicine');
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
# INSERT INTO department (name) VALUES ('Psychiatry');
# INSERT INTO department (name) VALUES ('Radiology');
# INSERT INTO department (name) VALUES ('Pathology');
# INSERT INTO department (name) VALUES ('Emergency Medicine');
# INSERT INTO department (name) VALUES ('Anesthesiology');
# DROP TABLE IF EXISTS departsment_doctors;
# USE hospitaldb;
#
# SET FOREIGN_KEY_CHECKS = 0;
#
# DROP TABLE IF EXISTS medical_record;
# DROP TABLE IF EXISTS prescription_medicine;
# DROP TABLE IF EXISTS prescription;
# DROP TABLE IF EXISTS appointment;
# DROP TABLE IF EXISTS insurance;
# DROP TABLE IF EXISTS patient;
# DROP TABLE IF EXISTS doctor;
# DROP TABLE IF EXISTS department_doctors;
# DROP TABLE IF EXISTS department;
# DROP TABLE IF EXISTS doctor_availability;
# DROP TABLE IF EXISTS bill;
# DROP TABLE IF EXISTS app_user;
#
# SET FOREIGN_KEY_CHECKS = 1;

# SELECT user_id, name, father_name, gender, birth_date, address, city
# FROM patient
# WHERE user_id = (SELECT id FROM app_user WHERE username = 'pk@gmail.com');
#
select *
from patient;
select *
from app_user;
select *
from user_roles;
# select *
# from insurance;
# select *
# from prescriptions;
# select *
# from appointment;
-- Nuclear option: wipe all data and let Hibernate rebuild cleanly
# SET FOREIGN_KEY_CHECKS = 0;
#
# TRUNCATE TABLE prescription_medicine;
# TRUNCATE TABLE prescription;
# TRUNCATE TABLE medical_record;
# TRUNCATE TABLE bill;
# TRUNCATE TABLE appointment;
#
# SET FOREIGN_KEY_CHECKS = 1;
# select *
# from department;
# # select *
# # from doctor_availability;
# select *
# from department_doctors;
select *
from doctor;
# SELECT * FROM doctor_availability
# WHERE doctor_id = (
#     SELECT id FROM doctor
#     WHERE email = 'dr.priya@hospital.com'
# );
# SELECT * FROM doctor_availability WHERE doctor_id = 3;
#      update doctor set specialization ='CardioLogy' where user_id=3;
# UPDATE department
# SET head_doctor_id = NULL
# WHERE id = 1;
# UPDATE doctor
# SET id = 3
# WHERE user_id = 3;
# java.lang.RuntimeException: Availability already set for this date: 2026-03-17
# SHOW CREATE TABLE appointment;
# ALTER TABLE appointment
#     MODIFY status ENUM('BOOKED','CONFIRMED','COMPLETED','CANCELLED');
# INSERT INTO medicine (name, category, type, dosage, manufacturer, price, stock) VALUES
#
# -- 🧠 Cardiology
# ('Amlodipine', 'Cardiology', 'TABLET', '5mg', 'Sun Pharma', 15.50, 200),
# ('Atenolol', 'Cardiology', 'TABLET', '50mg', 'Cipla', 12.00, 180),
# ('Losartan', 'Cardiology', 'TABLET', '25mg', 'Dr Reddy', 18.00, 150),
#
# -- 🤒 General Medicine
# ('Paracetamol', 'General', 'TABLET', '500mg', 'Crocin', 5.00, 500),
# ('Ibuprofen', 'General', 'TABLET', '400mg', 'Brufen', 8.00, 400),
# ('Azithromycin', 'General', 'TABLET', '500mg', 'Zithromax', 25.00, 250),
#
# -- 🦠 Antibiotics
# ('Amoxicillin', 'Antibiotic', 'CAPSULE', '250mg', 'Mankind', 20.00, 300),
# ('Cefixime', 'Antibiotic', 'TABLET', '200mg', 'Zifi', 35.00, 200),
#
# -- 🤧 Syrups
# ('Benadryl', 'Cough', 'SYRUP', '100ml', 'Johnson', 120.00, 100),
# ('Ascoril', 'Cough', 'SYRUP', '100ml', 'Glenmark', 110.00, 120),
#
# -- 💉 Injection
# ('Insulin', 'Diabetes', 'INJECTION', '10ml', 'Novo Nordisk', 250.00, 80),
# ('Heparin', 'Cardiology', 'INJECTION', '5ml', 'Pfizer', 300.00, 60),
#
# -- 🧴 Ointments
# ('Betadine', 'Skin', 'OINTMENT', '20g', 'Himalaya', 75.00, 140),
# ('Clotrimazole', 'Skin', 'OINTMENT', '15g', 'Cipla', 65.00, 130),
#
# -- 👁 Drops
# ('Refresh Tears', 'Eye', 'DROPS', '10ml', 'Allergan', 150.00, 90),
# ('Moxifloxacin', 'Eye', 'DROPS', '5ml', 'Alcon', 180.00, 70);