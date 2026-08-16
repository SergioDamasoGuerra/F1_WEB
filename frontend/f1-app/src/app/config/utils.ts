export function capitalizeText(texto: string) {
  if (!texto) return ''; // Maneja cadenas vacías de forma segura
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatDateDDMMM(dateString: string): string {
  const date = new Date(dateString);

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];

  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = months[date.getUTCMonth()];
  return `${day} ${month}`;
}



