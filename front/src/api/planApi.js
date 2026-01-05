// src/api/planApi.js
import { http } from "./http";

export const planApi = {
  my: () => http.get("/plan/my"),
};
