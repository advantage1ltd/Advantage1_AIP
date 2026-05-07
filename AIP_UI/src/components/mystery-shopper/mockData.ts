export const mockOfficers = [
  { id: "off1", name: "Mr Abhishek Abhishek" },
  { id: "off2", name: "Sarah Johnson" },
  { id: "off3", name: "Michael Brown" },
];

export const mockCustomers = [
  { id: "cust1", name: "ABC Corp" },
  { id: "cust2", name: "XYZ Ltd" },
  { id: "cust3", name: "123 Industries" },
];

export const mockLocations = [
  { id: "loc1", name: "London" },
  { id: "loc2", name: "Manchester" },
  { id: "loc3", name: "Birmingham" },
];

export const evaluationCriteria = [
  { id: "appearance", title: "Professional Appearance", maxScore: 10 },
  { id: "communication", title: "Communication Skills", maxScore: 10 },
  { id: "knowledge", title: "Product Knowledge", maxScore: 10 },
  { id: "service", title: "Customer Service", maxScore: 10 },
  { id: "efficiency", title: "Efficiency", maxScore: 10 },
];

export const defaultScores = evaluationCriteria.reduce((acc, criteria) => {
  acc[criteria.id] = { score: 0, comments: "" };
  return acc;
}, {} as Record<string, { score: number; comments: string }>);
