// Mock data for Padel Tournament Management System
const MOCK_DATA = {
  organizer: {
    name: "Club Pádel Buenos Aires",
    plan: "Pro",
    avatar: "CP",
  },

  stats: {
    torneosActivos: 3,
    jugadoresRegistrados: 248,
    inscripcionesPendientes: 14,
    partidosHoy: 8,
  },

  torneos: [
    {
      id: 1,
      nombre: "Copa de Verano 2026",
      estado: "activo",
      fechaInicio: "2026-04-10",
      fechaFin: "2026-04-27",
      sede: "Sede Central",
      categorias: [
        { id: 1, nombre: "Masculino A", cupo: 16, inscriptos: 14, estado: "abierta" },
        { id: 2, nombre: "Masculino B", cupo: 16, inscriptos: 16, estado: "llena" },
        { id: 3, nombre: "Femenino A", cupo: 8, inscriptos: 6, estado: "abierta" },
        { id: 4, nombre: "Mixto B", cupo: 12, inscriptos: 12, estado: "llena" },
      ],
      formato: "Grupos + Playoff",
    },
    {
      id: 2,
      nombre: "Torneo Otoño Pro",
      estado: "inscripciones",
      fechaInicio: "2026-05-15",
      fechaFin: "2026-05-22",
      sede: "Sede Norte",
      categorias: [
        { id: 5, nombre: "Masculino A", cupo: 8, inscriptos: 3, estado: "abierta" },
        { id: 6, nombre: "Femenino B", cupo: 8, inscriptos: 5, estado: "abierta" },
      ],
      formato: "Eliminación Simple",
    },
    {
      id: 3,
      nombre: "Circuito Interno Marzo",
      estado: "finalizado",
      fechaInicio: "2026-03-01",
      fechaFin: "2026-03-15",
      sede: "Sede Central",
      categorias: [
        { id: 7, nombre: "Masculino B", cupo: 16, inscriptos: 16, estado: "cerrada" },
        { id: 8, nombre: "Mixto A", cupo: 8, inscriptos: 8, estado: "cerrada" },
      ],
      formato: "Eliminación Simple",
    },
  ],

  inscripciones: [
    { id: 1, pareja: ["García, Martín", "López, Carlos"], categoria: "Masculino A", estado: "pendiente", fecha: "2026-04-18" },
    { id: 2, pareja: ["Ruiz, Ana", "Díaz, Sofía"], categoria: "Femenino A", estado: "pendiente", fecha: "2026-04-17" },
    { id: 3, pareja: ["Torres, Pablo", "Sánchez, Javier"], categoria: "Masculino A", estado: "aprobada", fecha: "2026-04-15" },
    { id: 4, pareja: ["Morales, Diego", "Herrera, Nicolás"], categoria: "Masculino A", estado: "aprobada", fecha: "2026-04-14" },
    { id: 5, pareja: ["Rodríguez, Lucía", "Fernández, Valentina"], categoria: "Femenino A", estado: "aprobada", fecha: "2026-04-13" },
    { id: 6, pareja: ["Castro, Emilio", "Mendez, Sergio"], categoria: "Masculino B", estado: "lista_espera", fecha: "2026-04-19" },
    { id: 7, pareja: ["Ortiz, Ramiro", "Vargas, Tomás"], categoria: "Masculino B", estado: "lista_espera", fecha: "2026-04-19" },
    { id: 8, pareja: ["Blanco, Marta", "Costa, Elena"], categoria: "Femenino A", estado: "rechazada", fecha: "2026-04-12" },
    { id: 9, pareja: ["Peralta, Facundo", "Gómez, Ignacio"], categoria: "Masculino A", estado: "aprobada", fecha: "2026-04-11" },
    { id: 10, pareja: ["Navarro, Camila", "Rios, Agustina"], categoria: "Femenino A", estado: "pendiente", fecha: "2026-04-20" },
  ],

  fixture: {
    categoriaId: 1,
    categoriaNombre: "Masculino A",
    formato: "Eliminación Simple",
    rondas: [
      {
        nombre: "Cuartos de Final",
        partidos: [
          { id: 1, local: "Torres / Sánchez", visitante: "Morales / Herrera", resultado: "6-3, 6-4", ganador: "Torres / Sánchez", cancha: "Cancha 1", hora: "10:00" },
          { id: 2, local: "Peralta / Gómez", visitante: "Ríos / Vega", resultado: "7-5, 4-6, 6-3", ganador: "Peralta / Gómez", cancha: "Cancha 2", hora: "11:30" },
          { id: 3, local: "Mendez / Acosta", visitante: "Palma / Leiva", resultado: "6-2, 6-1", ganador: "Mendez / Acosta", cancha: "Cancha 1", hora: "13:00" },
          { id: 4, local: "Suárez / Bravo", visitante: "Ibarra / Meza", resultado: null, ganador: null, cancha: "Cancha 3", hora: "14:30" },
        ],
      },
      {
        nombre: "Semifinal",
        partidos: [
          { id: 5, local: "Torres / Sánchez", visitante: "Peralta / Gómez", resultado: null, ganador: null, cancha: "Cancha 1", hora: "16:00" },
          { id: 6, local: "Mendez / Acosta", visitante: "TBD", resultado: null, ganador: null, cancha: "Cancha 2", hora: "16:00" },
        ],
      },
      {
        nombre: "Final",
        partidos: [
          { id: 7, local: "TBD", visitante: "TBD", resultado: null, ganador: null, cancha: "Cancha Central", hora: "18:00" },
        ],
      },
    ],
  },

  ranking: [
    { pos: 1, pareja: ["Torres, Pablo", "Sánchez, Javier"], pts: 320, torneos: 4, victorias: 11, derrotas: 2, categoria: "Masculino A" },
    { pos: 2, pareja: ["Peralta, Facundo", "Gómez, Ignacio"], pts: 290, torneos: 4, victorias: 10, derrotas: 3, categoria: "Masculino A" },
    { pos: 3, pareja: ["Morales, Diego", "Herrera, Nicolás"], pts: 240, torneos: 3, victorias: 8, derrotas: 4, categoria: "Masculino A" },
    { pos: 4, pareja: ["Mendez, Sergio", "Acosta, Bruno"], pts: 210, torneos: 4, victorias: 7, derrotas: 5, categoria: "Masculino A" },
    { pos: 5, pareja: ["Ríos, Mateo", "Vega, Ariel"], pts: 180, torneos: 3, victorias: 6, derrotas: 5, categoria: "Masculino A" },
    { pos: 6, pareja: ["Suárez, Joaquín", "Bravo, Luciano"], pts: 160, torneos: 4, victorias: 5, derrotas: 7, categoria: "Masculino A" },
    { pos: 7, pareja: ["Palma, Rodrigo", "Leiva, Cristian"], pts: 120, torneos: 2, victorias: 4, derrotas: 4, categoria: "Masculino A" },
    { pos: 8, pareja: ["Ibarra, Franco", "Meza, Gonzalo"], pts: 90, torneos: 2, victorias: 3, derrotas: 5, categoria: "Masculino A" },
  ],

  agenda: [
    { id: 1, hora: "09:00", cancha: "Cancha 1", partido: "García / López vs Ortiz / Vargas", categoria: "Masculino B", estado: "jugado" },
    { id: 2, hora: "10:30", cancha: "Cancha 2", partido: "Ruiz / Díaz vs Rodríguez / Fernández", categoria: "Femenino A", estado: "jugado" },
    { id: 3, hora: "12:00", cancha: "Cancha 1", partido: "Torres / Sánchez vs Morales / Herrera", categoria: "Masculino A", estado: "en_curso" },
    { id: 4, hora: "13:30", cancha: "Cancha 3", partido: "Peralta / Gómez vs Ríos / Vega", categoria: "Masculino A", estado: "programado" },
    { id: 5, hora: "15:00", cancha: "Cancha 2", partido: "Costa / Blanco vs Navarro / Rios", categoria: "Femenino A", estado: "programado" },
    { id: 6, hora: "16:30", cancha: "Cancha 1", partido: "Mendez / Acosta vs Palma / Leiva", categoria: "Masculino A", estado: "programado" },
    { id: 7, hora: "18:00", cancha: "Cancha Central", partido: "Suárez / Bravo vs Ibarra / Meza", categoria: "Masculino A", estado: "programado" },
  ],
};
