export type Role = "employee" | "leader" | "director";

export type Phone = { number: string } | string; 

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  docNumber: string;
  phones: Phone[];           
  managerId?: string | null;
  managerName?: string | null;
  role: Role | number;        
  dateOfBirth: string;
  createdAt?: string;
  updatedAt?: string;
}
