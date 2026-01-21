// src/services/animalService.ts
import apiClient from "./apiClient";

export type AnimalHealthStatus =
  | "HEALTHY"
  | "SICK"
  | "CRITICAL"
  | "PREGNANT"
  | "INJURED"
  | "UNKNOWN";

export type AnimalStatus =
  | "ACTIVE"
  | "NOT_ACTIVE"
  | "SICK"
  | "DEAD"
  | "SOLD";

export const HEALTH_STATUS_OPTIONS: AnimalHealthStatus[] = [
  "HEALTHY",
  "SICK",
  "CRITICAL",
  "PREGNANT",
  "INJURED",
  "UNKNOWN",
];

export const ANIMAL_STATUS_OPTIONS: AnimalStatus[] = [
  "ACTIVE",
  "NOT_ACTIVE",
  "SICK",
  "DEAD",
  "SOLD",
];

export interface AnimalManagementEntry {
  cattleId: number;

  animalColor?: string;

  birthDate?: string;
  age?: number;

  healthStatus?: AnimalHealthStatus;

  lastCheckupDate?: string;
  nextCheckupDate?: string;

  lastVaccinationDate?: string;
  nextVaccinationDate?: string;

  lastHeatDate?: string;
  lastBullMeetDate?: string;
  lastAIDate?: string;

  avgMilkProduction?: number;

  remarks?: string;
  status?: AnimalStatus;
}

// ADD
export const addAnimalRecord = async (entry: AnimalManagementEntry) => {
  console.log("[animalService] Saving animal record:", entry);

  const res = await apiClient.post("/animal/add", entry);
  return res.data;
};

// UPDATE
export const updateAnimalRecord = async (
  id: number,
  entry: Partial<AnimalManagementEntry>
) => {
  console.log("[animalService] Updating:", id, entry);

  const res = await apiClient.put(`/animal/${id}`, entry);
  return res.data;
};

// HISTORY
export const getAnimalHistory = async (cattleId: number) => {
  const res = await apiClient.get(`/animal/cattle/${cattleId}`);
  return res.data;
};

// LATEST
export const getLatestAnimalRecord = async (cattleId: number) => {
  const res = await apiClient.get(`/animal/cattle/${cattleId}/latest`);
  return res.data;
};
