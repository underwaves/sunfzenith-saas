import { TEMPLATE_CONFIG } from "@/config/template.config";

export const SERVICE_PACKAGES = TEMPLATE_CONFIG.packages;

export const POPULAR_PACKAGES = SERVICE_PACKAGES;
export type ServicePackage = (typeof SERVICE_PACKAGES)[number];
