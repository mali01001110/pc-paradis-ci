import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import type { ProductListResponse } from '@/types/product'

export interface ProductRowParams {
  category?: string
  ordering?: string
  pageSize?: number
  search?: string
}

export function productRowQueryKey(params: ProductRowParams): unknown[] {
  return [
    'product-row',
    params.category ?? '',
    params.ordering ?? '',
    params.search ?? '',
    params.pageSize ?? 8,
  ]
}

export function useProductRow(params: ProductRowParams = {}): UseQueryResult<ProductListResponse> {
  const { category, ordering = '-created_at', pageSize = 8, search } = params

  return useQuery({
    queryKey: productRowQueryKey(params),
    queryFn: async () => {
      const query: Record<string, string> = { page_size: String(pageSize) }
      if (category) query['category'] = category
      if (search) query['q'] = search
      query['ordering'] = ordering
      return (await productService.listProducts(query)).data
    },
  })
}
