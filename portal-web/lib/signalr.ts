"use client";

import * as signalR from "@microsoft/signalr";
import { apiUrl } from "@/lib/api";

export function createActivityConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(apiUrl("/hubs/activity"), { withCredentials: true })
    .withAutomaticReconnect()
    .build();
}
