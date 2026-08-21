import "server-only";

import { prisma } from "@/lib/prisma";
import { PUBLIC_PROPERTY_SCOPE } from "@/repositories/property-scope";

/**
 * Acceso a la tabla `inquiries`.
 *
 * `userId` es nulo cuando la consulta viene de un visitante: el portal admite
 * consultas sin cuenta (spec.md, sección 14).
 */

export function createInquiry(inquiry: {
  readonly propertyId: string;
  readonly userId: string | null;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly message: string;
}) {
  return prisma.inquiry.create({ data: inquiry, select: { id: true } });
}

/**
 * Página del historial de solicitudes de una persona.
 *
 * Solo las suyas y solo las que no ha ocultado. La búsqueda mira el título de
 * la propiedad y el texto del mensaje, que son las dos formas naturales de
 * recordar una consulta.
 *
 * Se exige además que la propiedad siga en el catálogo público, igual que en
 * los favoritos: una eliminada o despublicada no tiene ficha que abrir, y el
 * registro llevaría a un 404. La consulta no se pierde —ADMIN la conserva
 * para responderla—, simplemente deja de figurar aquí.
 */
export async function findUserInquiries(
  userId: string,
  options: {
    readonly search: string;
    readonly skip: number;
    readonly take: number;
  },
) {
  const where = {
    userId,
    hiddenByUserAt: null,
    property: PUBLIC_PROPERTY_SCOPE,
    ...(options.search
      ? {
          OR: [
            {
              property: {
                title: {
                  contains: options.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              message: {
                contains: options.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  // El total se cuenta con el mismo filtro: la paginación debe reflejar los
  // resultados de la búsqueda, no el historial entero.
  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.take,
      select: {
        id: true,
        message: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            title: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  return { inquiries, total };
}

/**
 * Oculta una solicitud del historial de quien la envió.
 *
 * El `where` incluye el usuario: nadie puede ocultar la solicitud de otra
 * persona aunque conozca su identificador. Devuelve cuántas filas cambió.
 */
export async function hideInquiryFromUser(
  inquiryId: string,
  userId: string,
): Promise<number> {
  const { count } = await prisma.inquiry.updateMany({
    where: { id: inquiryId, userId, hiddenByUserAt: null },
    data: { hiddenByUserAt: new Date() },
  });

  return count;
}

/**
 * Página del listado de consultas de la administración.
 *
 * Sin filtro por `hiddenByUserAt` ni por el estado de la propiedad: aquí se
 * ven **todas**, incluidas las que quien las escribió quitó de su historial y
 * las de propiedades despublicadas o eliminadas. Ese es el motivo por el que
 * ambos borrados son lógicos: la consulta es un contacto comercial que la
 * inmobiliaria tiene que poder responder (spec.md, sección 22).
 */
export async function findAdminInquiries(options: {
  /** Condiciones ya traducidas por `admin-inquiry-query.ts`. */
  readonly filters: Record<string, unknown>;
  readonly skip: number;
  readonly take: number;
}) {
  const where = options.filters;

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        createdAt: true,
        hiddenByUserAt: true,
        property: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            deletedAt: true,
          },
        },
        // Nulo cuando la envió un visitante sin cuenta.
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  return { inquiries, total };
}
