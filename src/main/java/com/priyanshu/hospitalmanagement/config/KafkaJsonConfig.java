package com.priyanshu.hospitalmanagement.config;


import com.priyanshu.hospitalmanagement.kafka.event.AppointmentEmailEvent;
import com.priyanshu.hospitalmanagement.kafka.event.BillingEmailEvent;
import com.priyanshu.hospitalmanagement.kafka.event.UserEmailEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true")
public class KafkaJsonConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // ── APPOINTMENT ───────────────────────────────────────────────────────────

    @Bean
    public ProducerFactory<String, AppointmentEmailEvent> appointmentProducerFactory() {
        return new DefaultKafkaProducerFactory<>(Map.of(
                ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
                ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class,
                JsonSerializer.ADD_TYPE_INFO_HEADERS, false
        ));
    }

    @Bean
    public KafkaTemplate<String, AppointmentEmailEvent> appointmentKafkaTemplate() {
        return new KafkaTemplate<>(appointmentProducerFactory());
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, AppointmentEmailEvent>
    appointmentKafkaListenerContainerFactory() {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, AppointmentEmailEvent>();
        factory.setConsumerFactory(new DefaultKafkaConsumerFactory<>(
                consumerBaseProps(),
                new StringDeserializer(),
                new JsonDeserializer<>(AppointmentEmailEvent.class, false)
        ));
        return factory;
    }

    // ── BILLING ───────────────────────────────────────────────────────────────

    @Bean
    public ProducerFactory<String, BillingEmailEvent> billingProducerFactory() {
        return new DefaultKafkaProducerFactory<>(Map.of(
                ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
                ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class,
                JsonSerializer.ADD_TYPE_INFO_HEADERS, false
        ));
    }

    @Bean
    public KafkaTemplate<String, BillingEmailEvent> billingKafkaTemplate() {
        return new KafkaTemplate<>(billingProducerFactory());
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, BillingEmailEvent>
    billingKafkaListenerContainerFactory() {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, BillingEmailEvent>();
        factory.setConsumerFactory(new DefaultKafkaConsumerFactory<>(
                consumerBaseProps(),
                new StringDeserializer(),
                new JsonDeserializer<>(BillingEmailEvent.class, false)
        ));
        return factory;
    }

    // ── USER ──────────────────────────────────────────────────────────────────

    @Bean
    public ProducerFactory<String, UserEmailEvent> userProducerFactory() {
        return new DefaultKafkaProducerFactory<>(Map.of(
                ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
                ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class,
                JsonSerializer.ADD_TYPE_INFO_HEADERS, false
        ));
    }

    @Bean
    public KafkaTemplate<String, UserEmailEvent> userKafkaTemplate() {
        return new KafkaTemplate<>(userProducerFactory());
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, UserEmailEvent>
    userKafkaListenerContainerFactory() {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, UserEmailEvent>();
        factory.setConsumerFactory(new DefaultKafkaConsumerFactory<>(
                consumerBaseProps(),
                new StringDeserializer(),
                new JsonDeserializer<>(UserEmailEvent.class, false)
        ));
        return factory;
    }

    // ── SHARED BASE PROPS ─────────────────────────────────────────────────────

    private Map<String, Object> consumerBaseProps() {
        return Map.of(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
                ConsumerConfig.GROUP_ID_CONFIG, "hospital-email-group",
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
                ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class
        );
    }
}