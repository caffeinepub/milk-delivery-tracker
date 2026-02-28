import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DeliveryEntry {
    id: bigint;
    householdId: bigint;
    status: DeliveryStatus;
    date: string;
    milkTypeId: bigint;
    quantityLiters: number;
}
export interface HolidayDate {
    date: string;
    note: string;
}
export interface MonthlySummary {
    month: string;
    householdSummaries: Array<[bigint, number]>;
    milkTypeSummaries: Array<[bigint, number]>;
}
export interface MilkType {
    id: bigint;
    name: string;
}
export interface Household {
    id: bigint;
    name: string;
    address: string;
    contactPhone: string;
}
export interface UserProfile {
    name: string;
}
export enum DeliveryStatus {
    skipped = "skipped",
    delivered = "delivered",
    holiday = "holiday"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDeliveryEntry(householdId: bigint, milkTypeId: bigint, date: string, quantityLiters: number, status: DeliveryStatus): Promise<DeliveryEntry>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createHousehold(name: string, address: string, contactPhone: string): Promise<Household>;
    createMilkType(name: string): Promise<MilkType>;
    deleteDeliveryEntry(id: bigint): Promise<void>;
    deleteHousehold(id: bigint): Promise<void>;
    deleteMilkType(id: bigint): Promise<void>;
    getAllHolidays(): Promise<Array<HolidayDate>>;
    getAllHouseholds(): Promise<Array<Household>>;
    getAllMilkTypes(): Promise<Array<MilkType>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDeliveryEntriesForHousehold(householdId: bigint): Promise<Array<DeliveryEntry>>;
    getDeliveryEntriesForMonth(month: string): Promise<Array<DeliveryEntry>>;
    getHousehold(id: bigint): Promise<Household | null>;
    getMilkType(id: bigint): Promise<MilkType | null>;
    getMonthlySummary(month: string): Promise<MonthlySummary>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markHoliday(date: string, note: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    unmarkHoliday(date: string): Promise<void>;
    updateDeliveryEntry(id: bigint, householdId: bigint, milkTypeId: bigint, date: string, quantityLiters: number, status: DeliveryStatus): Promise<void>;
    updateHousehold(id: bigint, name: string, address: string, contactPhone: string): Promise<void>;
    updateMilkType(id: bigint, name: string): Promise<void>;
}
