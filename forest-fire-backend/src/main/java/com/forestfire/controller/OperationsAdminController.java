package com.forestfire.controller;

import com.forestfire.model.AdminOutpostRequest;
import com.forestfire.model.AdminSensorRequest;
import com.forestfire.model.EquipmentUsageRequest;
import com.forestfire.model.EquipmentUsageResponse;
import com.forestfire.model.ForestMapOutpost;
import com.forestfire.model.ForestMapSensor;
import com.forestfire.service.SensorSimulationService;
import com.forestfire.dao.OutpostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
public class OperationsAdminController {

    private final SensorSimulationService simulationService;
    private final OutpostRepository outpostRepository;

    public OperationsAdminController(SensorSimulationService simulationService, OutpostRepository outpostRepository) {
        this.simulationService = simulationService;
        this.outpostRepository = outpostRepository;
    }

    @PostMapping("/sensors")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ForestMapSensor> createSensor(@RequestBody AdminSensorRequest request) {
        try {
            return ResponseEntity.ok(simulationService.registerAdminSensor(request, "EMPLOYEE"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/outposts")
    @PreAuthorize("hasRole('HEAD')")
    public ResponseEntity<ForestMapOutpost> createOutpost(@RequestBody AdminOutpostRequest request) {
        try {
            return ResponseEntity.ok(simulationService.registerAdminOutpost(request, "HEAD"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/outposts/{outpostId}/equipment/use")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<EquipmentUsageResponse> useOutpostEquipment(@PathVariable String outpostId,
                                                                      @RequestBody EquipmentUsageRequest request) {
        try {
            return ResponseEntity.ok(simulationService.useOutpostEquipment(outpostId, request, "EMPLOYEE"));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/outposts/{outpostId}")
    @PreAuthorize("hasRole('HEAD')")
    public ResponseEntity<Void> deleteOutpost(@PathVariable String outpostId) {
        try {
            outpostRepository.findByOutpostId(outpostId)
                    .ifPresent(outpostRepository::delete);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
}