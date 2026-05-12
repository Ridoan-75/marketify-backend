export interface PaginateOptions {
  page?: number;
  limit?: number;
}

export interface PaginateResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const paginate = (options: PaginateOptions = {}): PaginateResult => {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 10));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

export const paginateMeta = (total: number, page: number, limit: number) => {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};