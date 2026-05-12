package com.forestfire.controller;

import com.forestfire.dao.ForestZoneRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HomeController.class)
@AutoConfigureMockMvc(addFilters = false)
class HomeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ForestZoneRepository forestZoneRepository;

    @Test
    void homeReturnsApiRoutes() throws Exception {
        mockMvc.perform(get("/").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("Forest Fire Detection System"))
                .andExpect(jsonPath("$.status").value("running"))
                .andExpect(jsonPath("$.coverage").value("India wildfire risk regions"))
                .andExpect(jsonPath("$.routes.health").value("/api/v1/health"));
    }

    @Test
    void healthReturnsDbAwareStatus() throws Exception {
        when(forestZoneRepository.count()).thenReturn(12L);

        mockMvc.perform(get("/api/v1/health").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("UP"))
                .andExpect(jsonPath("$.zoneCount").value(12));
    }
}
