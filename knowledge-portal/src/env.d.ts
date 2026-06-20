/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    currentUser?: {
      id: number;
      email: string;
      username: string;
    } | null;
  }
}
