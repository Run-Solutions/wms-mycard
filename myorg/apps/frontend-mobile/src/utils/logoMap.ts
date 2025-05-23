const getLocalLogo = (fileName: string): any => {
    const logos: Record<string, any> = {
      'items.webp': require('../../assets/logos/items.webp'),
      'arrivals.webp': require('../../assets/logos/arrivals.webp'),
      'putaway.webp': require('../../assets/logos/putaway.webp'),
      'users.webp': require('../../assets/logos/users.webp'),
      'settings.webp': require('../../assets/logos/settings.webp'),
    };
    return logos[fileName] || require('../../assets/logos/extra.webp');
  };
  
  export default getLocalLogo;