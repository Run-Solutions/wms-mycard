// src/config/sidebarItems.ts
export interface MenuItem {
    name: string;
    logoName: string;
    route: string;
  }
  
  export const sidebarItems: MenuItem[] = [
    { name: 'Home',      logoName: 'home.webp', route: 'Dashboard' }
    /*{ label: 'Users',     logoName: '/logos/users.webp' },
    { label: 'OTs',   logoName: '/logos/picking.webp' },
    { label: 'Seguimiento',  logoName: '/logos/slotting.webp' },
    { label: 'Dashboards',logoName: '/logos/dashboard.webp' },
    { label: 'Finalización',   logoName: '/logos/packing.webp' },
    { label: "Locations", logo: "/logos/ubication.webp" },
    { label: "Arrivals",  logo: "/logos/arrivals.webp" },
    { label: "Putaway",   logo: "/logos/putaway.webp" },
    { label: "Items",     logo: "/logos/items.webp" },*/
  ];
  