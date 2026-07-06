"use client";
import { createContext, useContext } from "react";

export interface SellerProfileData {
  id: number;
  shop_name: string;
  owner_name: string;
  status: "pending" | "active" | "rejected";
  description?: string | null;
  logo?: string | null;
}

export const SellerProfileContext = createContext<SellerProfileData | null>(null);
export function useSellerProfile() { return useContext(SellerProfileContext); }
