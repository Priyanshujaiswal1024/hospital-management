package com.priyanshu.hospitalmanagement.entity;

import com.priyanshu.hospitalmanagement.security.RolePermissionMapping;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class UserPrincipal implements UserDetails {

    private final User user;

    public UserPrincipal(User user){
        this.user = user;
    }

    public Long getId(){
        return user.getId();
    }

    @Override
    public String getUsername(){
        return user.getUsername();
    }

    @Override
    public String getPassword(){
        return user.getPassword();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities(){

        Set<SimpleGrantedAuthority> authorities = new HashSet<>();

        user.getRoles().forEach(role -> {

            Set<SimpleGrantedAuthority> permissions =
                    RolePermissionMapping.getAuthoritiesForRole(role);

            authorities.addAll(permissions);

            authorities.add(
                    new SimpleGrantedAuthority("ROLE_" + role.name())
            );

        });

        return authorities;
    }

    @Override public boolean isAccountNonExpired(){ return true; }

    @Override public boolean isAccountNonLocked(){ return true; }

    @Override public boolean isCredentialsNonExpired(){ return true; }

    @Override public boolean isEnabled(){ return true; }
}