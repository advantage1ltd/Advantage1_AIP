export interface Manager {
  id: string;
  name: string;
  role: string;
}

export const mockManagers = [
  { id: "m1", name: "John Smith", role: "Senior Manager" },
  { id: "m2", name: "Sarah Johnson", role: "Department Head" },
  { id: "m3", name: "Michael Brown", role: "Team Lead" },
  { id: "m4", name: "Emily Davis", role: "Operations Manager" },
]; 