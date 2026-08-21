import "server-only";

import {
  ADMIN_INQUIRIES_PER_PAGE,
  type AdminInquiryDto,
  type AdminInquiryListQuery,
  type AdminInquiryPageDto,
} from "@portal/contracts";

import { findAdminInquiries } from "@/repositories/inquiry-repository";
import { buildAdminInquiryWhere } from "@/services/admin-inquiry-query";

/**
 * Listado de consultas para la administración (spec.md, sección 22).
 *
 * Se ven todas: las de visitantes sin cuenta, las que su autor quitó de su
 * historial y las de propiedades que ya no están en el catálogo.
 */

type AdminInquiryRecord = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly message: string;
  readonly createdAt: Date;
  readonly hiddenByUserAt: Date | null;
  readonly property: {
    readonly id: string;
    readonly title: string;
    readonly isPublished: boolean;
    readonly deletedAt: Date | null;
  };
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
  } | null;
};

export async function listAdminInquiries(
  query: AdminInquiryListQuery = {},
): Promise<AdminInquiryPageDto> {
  const page = normalizePage(query.page);

  const { inquiries, total } = await findAdminInquiries({
    filters: buildAdminInquiryWhere(query),
    skip: (page - 1) * ADMIN_INQUIRIES_PER_PAGE,
    take: ADMIN_INQUIRIES_PER_PAGE,
  });

  return {
    data: inquiries.map(toAdminInquiry),
    total,
    page,
    pageSize: ADMIN_INQUIRIES_PER_PAGE,
  };
}

/**
 * Las fechas internas se traducen a los dos hechos que interesan aquí: si la
 * propiedad sigue existiendo y si su autor la ocultó. El momento exacto en
 * que ocurrió cualquiera de las dos cosas no aporta nada a esta pantalla.
 */
function toAdminInquiry(inquiry: AdminInquiryRecord): AdminInquiryDto {
  return {
    id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    message: inquiry.message,
    createdAt: inquiry.createdAt.toISOString(),
    property: {
      id: inquiry.property.id,
      title: inquiry.property.title,
      isPublished: inquiry.property.isPublished,
      isDeleted: inquiry.property.deletedAt !== null,
    },
    user: inquiry.user,
    isHiddenByUser: inquiry.hiddenByUserAt !== null,
  };
}

/** Una página fuera de rango se trata como la primera. */
function normalizePage(page: number | undefined): number {
  return Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
}
