import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface StudentResult {
    id: bigint;
    maths: bigint;
    tamil: bigint;
    total: bigint;
    studentName: string;
    average: number;
    grade: string;
    rollNumber: string;
    timestamp: bigint;
    english: bigint;
    science: bigint;
    computerScience: bigint;
}
export interface backendInterface {
    addResult(rollNumber: string, studentName: string, maths: bigint, science: bigint, english: bigint, tamil: bigint, computerScience: bigint, total: bigint, average: number, grade: string, timestamp: bigint): Promise<bigint>;
    clearAll(): Promise<void>;
    deleteResult(id: bigint): Promise<void>;
    getResults(): Promise<Array<StudentResult>>;
}
