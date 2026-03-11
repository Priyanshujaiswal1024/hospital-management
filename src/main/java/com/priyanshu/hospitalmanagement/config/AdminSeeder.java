package com.priyanshu.hospitalmanagement.config;

import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.entity.type.RoleType;
import com.priyanshu.hospitalmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        Optional<User> admin = userRepository.findByUsername("Priyanshu");

        if(admin.isEmpty()){

            User user = new User();

            user.setUsername("Priyanshu");
            user.setPassword(passwordEncoder.encode("2401301024"));

            Set<RoleType> roles = new HashSet<>();
            roles.add(RoleType.ADMIN);

            user.setRoles(roles);
            userRepository.save(user);

//            System.out.println("Default admin created");
            System.out.println("Default admin created That is YOU");
        }
    }
}