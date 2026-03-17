package com.priyanshu.hospitalmanagement.config;

import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.entity.type.RoleType;
import com.priyanshu.hospitalmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        Optional<User> admin = userRepository.findByUsername("priyanshjais123@gmail.com");


        if (admin.isEmpty()) {

            User user = new User();
            user.setFullName("Priyanshu");
            user.setUsername("priyanshjais123@gmail.com");  // username = email ✅
            user.setPassword(passwordEncoder.encode("2401301024"));
            user.setPhone("8307723297");
            user.setEmailVerified(true);                    // ✅ verified by default

            Set<RoleType> roles = new HashSet<>();
            roles.add(RoleType.ADMIN);
            user.setRoles(roles);

            userRepository.save(user);
            log.info("✅ Default admin created: priyanshjais123@gmail.com");
        } else {
            log.info("✅ Admin already exists — skipping seeder");
        }
    }
}