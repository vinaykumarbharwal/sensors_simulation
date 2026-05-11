package com.forestfire;

import com.forestfire.service.ForestRiskRegionCatalog;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.stream.Collectors;

/**
 * Forest Fire Early Detection System
 *
 * Monitors high-risk forest belts across India.
 */
@SpringBootApplication
@EnableScheduling
public class ForestFireApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(ForestFireApplication.class);
        application.addListeners((ApplicationListener<WebServerInitializedEvent>) event -> {
            int port = event.getWebServer().getPort();
            System.out.println("======================================");
            System.out.println("  Forest Fire Detection System LIVE");
            System.out.println("  API: http://localhost:" + port + "/api/v1");
            System.out.println("  Health: http://localhost:" + port + "/api/v1/health");
            System.out.println("  Map: http://localhost:" + port + "/api/v1/map");
            System.out.println("  Coverage: " + ForestRiskRegionCatalog.REGIONS.size() + " high-risk regions across India");
            System.out.println("  States: " + ForestRiskRegionCatalog.REGIONS.stream()
                    .map(ForestRiskRegionCatalog.RiskRegion::state)
                    .distinct()
                    .collect(Collectors.joining(", ")));
            System.out.println("======================================");
        });
        application.run(args);
    }
}
