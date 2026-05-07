export interface ServiceItem {
  name: string;
  children?: ServiceItem[];
}

export const SERVICES_HIERARCHY: ServiceItem[] = [
  {
    name: "Manned Security",
    children: [
      { name: "Retail Officers" },
      { name: "Store Detective" },
      { name: "Loss Prevention Officers" },
      { name: "Covert Operatives" },
      { name: "Gatehouse Officers" },
      { name: "Concierge Officers" },
      { name: "Fire Wardens" },
      { name: "Public Protection (CSAS RSAS)" },
      { name: "Crime Scene Protection" },
      { name: "Event Officers" }
    ]
  },
  {
    name: "Monitoring",
    children: [
      { name: "Alarm Receiving" },
      { name: "CCTV Monitoring" },
      { name: "System(s) Monitoring" }
    ]
  },
  {
    name: "Response",
    children: [
      { name: "Key Holding or Support" },
      { name: "Alarm Response" },
      { name: "Lone Worker Response" },
      { name: "Patrol Services" },
      { name: "CCTV Patrols" }
    ]
  },
  {
    name: "Fire & Security",
    children: [
      { name: "CCTV Installations" },
      { name: "ANPR" },
      { name: "Facial Recognition" },
      {
        name: "Fire System Installations",
        children: [
          { name: "Suppression" },
          { name: "Hand Extinguishers" }
        ]
      },
      { name: "Intruder Installations" },
      { name: "System Monitoring" },
      {
        name: "Maintenance",
        children: [
          { name: "CCTV" },
          { name: "Fire" },
          { name: "Intruder" },
          { name: "System" }
        ]
      }
    ]
  },
  {
    name: "Infrastructure",
    children: [
      { name: "Plumbing / Gas" },
      { name: "Electrical" },
      { name: "Construction" }
    ]
  },
  {
    name: "Training Academy",
    children: [
      {
        name: "First Aid",
        children: [
          { name: "EFAW" },
          { name: "Paediatric" },
          { name: "Defibrillator" },
          { name: "Level 3" }
        ]
      },
      {
        name: "Health & Safety",
        children: [
          { name: "Safe Loading" },
          { name: "Manual Handling" },
          { name: "H & S in the Workplace" },
          { name: "Level 1" },
          { name: "Working at Height" }
        ]
      },
      {
        name: "Fire & Safety",
        children: [
          { name: "Fire Warden" },
          { name: "Fire Safety Awareness" }
        ]
      },
      {
        name: "Security Licensing",
        children: [
          {
            name: "Full Courses",
            children: [
              { name: "Security Guarding" },
              { name: "CCTV" },
              { name: "Door Supervisor" }
            ]
          },
          {
            name: "Top-up",
            children: [
              { name: "Security Guarding" },
              { name: "CCTV" },
              { name: "Door Supervisor" }
            ]
          }
        ]
      },
      { name: "E-learning" }
    ]
  },
  {
    name: "Other Services",
    children: [
      { name: "Crime Hub" },
      { name: "CCTV Stations / Vehicles" },
      { name: "Cleaning Services" }
    ]
  }
];
