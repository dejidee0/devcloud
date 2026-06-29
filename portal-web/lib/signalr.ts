"use client";

import * as signalR from "@microsoft/signalr";
import { apiUrl, authToken } from "@/lib/api";

export function createActivityConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(apiUrl("/hubs/activity"), {
      accessTokenFactory: () => authToken() ?? ""
    })
    .withAutomaticReconnect()
    .build();
}
