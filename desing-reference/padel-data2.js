// Extended mock data for players and reports
const PLAYERS_DATA = [
  { id: 1, nombre: "Martín García", email: "mgarcia@mail.com", telefono: "+54 9 11 4521-3344", avatar: "MG", categorias: ["Masculino A", "Masculino B"], ranking: { "Masculino A": 3, "Masculino B": 1 }, torneos: 7, victorias: 22, derrotas: 9, puntos: 380, sede: "Sede Central", activo: true, fechaRegistro: "2024-03-15",
    historial: [
      { torneo: "Copa de Verano 2026", categoria: "Masculino A", pareja: "López, Carlos", resultado: "Semifinal", fecha: "2026-04-10" },
      { torneo: "Torneo Otoño 2025", categoria: "Masculino A", pareja: "López, Carlos", resultado: "Campeón 🏆", fecha: "2025-09-12" },
      { torneo: "Circuito Interno Agosto", categoria: "Masculino B", pareja: "Pérez, Rodrigo", resultado: "Cuartos", fecha: "2025-08-05" },
    ]
  },
  { id: 2, nombre: "Carlos López", email: "clopez@mail.com", telefono: "+54 9 11 5533-2211", avatar: "CL", categorias: ["Masculino A"], ranking: { "Masculino A": 5 }, torneos: 5, victorias: 14, derrotas: 10, puntos: 240, sede: "Sede Central", activo: true, fechaRegistro: "2024-05-20",
    historial: [
      { torneo: "Copa de Verano 2026", categoria: "Masculino A", pareja: "García, Martín", resultado: "Semifinal", fecha: "2026-04-10" },
      { torneo: "Torneo Otoño 2025", categoria: "Masculino A", pareja: "García, Martín", resultado: "Campeón 🏆", fecha: "2025-09-12" },
    ]
  },
  { id: 3, nombre: "Ana Ruiz", email: "aruiz@mail.com", telefono: "+54 9 11 6644-1122", avatar: "AR", categorias: ["Femenino A", "Mixto B"], ranking: { "Femenino A": 2, "Mixto B": 4 }, torneos: 6, victorias: 18, derrotas: 7, puntos: 310, sede: "Sede Norte", activo: true, fechaRegistro: "2024-02-10",
    historial: [
      { torneo: "Copa de Verano 2026", categoria: "Femenino A", pareja: "Díaz, Sofía", resultado: "En curso", fecha: "2026-04-10" },
      { torneo: "Circuito Interno Marzo", categoria: "Mixto B", pareja: "Herrera, Diego", resultado: "Final", fecha: "2026-03-01" },
    ]
  },
  { id: 4, nombre: "Pablo Torres", email: "ptorres@mail.com", telefono: "+54 9 11 7755-9988", avatar: "PT", categorias: ["Masculino A"], ranking: { "Masculino A": 1 }, torneos: 8, victorias: 28, derrotas: 6, puntos: 520, sede: "Sede Central", activo: true, fechaRegistro: "2023-11-08",
    historial: [
      { torneo: "Copa de Verano 2026", categoria: "Masculino A", pareja: "Sánchez, Javier", resultado: "Cuartos (ganó)", fecha: "2026-04-10" },
      { torneo: "Circuito Interno Marzo", categoria: "Masculino A", pareja: "Sánchez, Javier", resultado: "Campeón 🏆", fecha: "2026-03-01" },
      { torneo: "Copa Invierno 2025", categoria: "Masculino A", pareja: "Sánchez, Javier", resultado: "Campeón 🏆", fecha: "2025-07-15" },
    ]
  },
  { id: 5, nombre: "Sofía Díaz", email: "sdiaz@mail.com", telefono: "+54 9 11 3322-7766", avatar: "SD", categorias: ["Femenino A"], ranking: { "Femenino A": 3 }, torneos: 4, victorias: 10, derrotas: 8, puntos: 195, sede: "Sede Norte", activo: true, fechaRegistro: "2024-08-30",
    historial: [
      { torneo: "Copa de Verano 2026", categoria: "Femenino A", pareja: "Ruiz, Ana", resultado: "Pendiente", fecha: "2026-04-10" },
    ]
  },
  { id: 6, nombre: "Diego Morales", email: "dmorales@mail.com", telefono: "+54 9 11 8899-4455", avatar: "DM", categorias: ["Masculino A", "Mixto B"], ranking: { "Masculino A": 4 }, torneos: 6, victorias: 16, derrotas: 11, puntos: 270, sede: "Sede Central", activo: true, fechaRegistro: "2024-01-22",
    historial: [
      { torneo: "Copa de Verano 2026", categoria: "Masculino A", pareja: "Herrera, Nicolás", resultado: "Cuartos (perdió)", fecha: "2026-04-10" },
    ]
  },
  { id: 7, nombre: "Valentina Fernández", email: "vfernandez@mail.com", telefono: "+54 9 11 2211-6677", avatar: "VF", categorias: ["Femenino A", "Mixto B"], ranking: { "Femenino A": 1 }, torneos: 9, victorias: 30, derrotas: 5, puntos: 580, sede: "Sede Central", activo: true, fechaRegistro: "2023-09-14",
    historial: [
      { torneo: "Copa de Verano 2026", categoria: "Femenino A", pareja: "Rodríguez, Lucía", resultado: "Aprobada", fecha: "2026-04-10" },
      { torneo: "Circuito Interno Marzo", categoria: "Femenino A", pareja: "Rodríguez, Lucía", resultado: "Campeón 🏆", fecha: "2026-03-01" },
    ]
  },
  { id: 8, nombre: "Facundo Peralta", email: "fperalta@mail.com", telefono: "+54 9 11 5544-3322", avatar: "FP", categorias: ["Masculino A"], ranking: { "Masculino A": 2 }, torneos: 7, victorias: 24, derrotas: 8, puntos: 420, sede: "Sede Central", activo: true, fechaRegistro: "2024-04-01",
    historial: [
      { torneo: "Copa de Verano 2026", categoria: "Masculino A", pareja: "Gómez, Ignacio", resultado: "Cuartos (ganó)", fecha: "2026-04-10" },
      { torneo: "Circuito Interno Marzo", categoria: "Masculino A", pareja: "Gómez, Ignacio", resultado: "Subcampeón", fecha: "2026-03-01" },
    ]
  },
];

const REPORTS_DATA = {
  inscriptosPorTorneo: [
    { torneo: "Copa de Verano 2026", estado: "activo", total: 48, aprobadas: 38, pendientes: 7, espera: 3, categorias: 4 },
    { torneo: "Torneo Otoño Pro", estado: "inscripciones", total: 8, aprobadas: 0, pendientes: 8, espera: 0, categorias: 2 },
    { torneo: "Circuito Interno Marzo", estado: "finalizado", total: 24, aprobadas: 24, pendientes: 0, espera: 0, categorias: 2 },
  ],
  partidosPorTorneo: [
    { torneo: "Copa de Verano 2026", jugados: 12, pendientes: 8, reprogramados: 1, walkovers: 0 },
    { torneo: "Circuito Interno Marzo", jugados: 24, pendientes: 0, reprogramados: 2, walkovers: 1 },
  ],
  campeones: [
    { torneo: "Circuito Interno Marzo 2026", categoria: "Masculino A", campeon: "Torres / Sánchez", subcampeon: "Peralta / Gómez", fecha: "2026-03-15" },
    { torneo: "Circuito Interno Marzo 2026", categoria: "Femenino A", campeon: "Fernández / Rodríguez", subcampeon: "Ruiz / Díaz", fecha: "2026-03-15" },
    { torneo: "Copa Invierno 2025", categoria: "Masculino A", campeon: "Torres / Sánchez", subcampeon: "Morales / Herrera", fecha: "2025-07-20" },
    { torneo: "Copa Invierno 2025", categoria: "Femenino B", campeon: "Costa / Navarro", subcampeon: "Blanco / Ríos", fecha: "2025-07-20" },
    { torneo: "Torneo Otoño 2025", categoria: "Masculino A", campeon: "García / López", subcampeon: "Peralta / Gómez", fecha: "2025-09-18" },
  ],
  ocupacionCanchas: [
    { sede: "Sede Central", cancha: "Cancha 1", torneo: "Copa de Verano 2026", horasUsadas: 14, horasDisponibles: 20, partidos: 9 },
    { sede: "Sede Central", cancha: "Cancha 2", torneo: "Copa de Verano 2026", horasUsadas: 11, horasDisponibles: 20, partidos: 7 },
    { sede: "Sede Central", cancha: "Cancha 3", torneo: "Copa de Verano 2026", horasUsadas: 8, horasDisponibles: 20, partidos: 5 },
    { sede: "Sede Central", cancha: "Cancha Central", torneo: "Copa de Verano 2026", horasUsadas: 4, horasDisponibles: 8, partidos: 2 },
    { sede: "Sede Norte", cancha: "Cancha 1", torneo: "Torneo Otoño Pro", horasUsadas: 0, horasDisponibles: 16, partidos: 0 },
  ],
};

Object.assign(window, { PLAYERS_DATA, REPORTS_DATA });
