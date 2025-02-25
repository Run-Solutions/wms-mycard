// src/config/sidebarItems.ts
export interface MenuItem {
    label: string;
    logo: string;
  }
  
  export const sidebarItems: MenuItem[] = [
    { label: "Home",      logo: "/logos/home.webp" },
    { label: "Users",     logo: "/logos/users.webp" },
    { label: "Picking",   logo: "/logos/picking.webp" },
    { label: "Slotting",  logo: "/logos/slotting.webp" },
    { label: "Dashboards",logo: "/logos/dashboard.webp" },
    { label: "Packing",   logo: "/logos/packing.webp" },
    { label: "Locations", logo: "/logos/ubication.webp" },
    { label: "Arrivals",  logo: "/logos/arrivals.webp" },
    { label: "Putaway",   logo: "/logos/putaway.webp" },
    { label: "Items",     logo: "/logos/items.webp" },
  ];
  