export const paths = {
  login: '/login',
  register: '/registro',
  splash: '/bienvenida',
  panel: '/panel',
  panelPedidos: '/panel/pedidos',
  panelStaff: '/panel/staff',
  panelCarta: '/panel/carta',
  panelMenus: '/panel/menus',
  panelSalon: '/panel/salon',
  panelSalonLienzo: '/panel/salon/:salonId',
  panelMesas: '/panel/mesas',
  panelStock: '/panel/stock',
  panelTurnos: '/panel/turnos',
  panelPromociones: '/panel/promociones',
  panelReportes: '/panel/reportes',
  panelConfiguracion: '/panel/configuracion',
  panelPerfil: '/panel/perfil',
} as const

export function panelSalonLienzoPath(salonId: string): string {
  return `/panel/salon/${salonId}`
}
