import { useQuery } from '@tanstack/react-query'
import { categoryService } from '@/services/productService'
import { CategoryShowcase, CategoryShowcaseSkeleton } from '@/components/CategoryShowcase'
import type { FlatCategory } from '@/components/CategoryShowcase'
import type { Category } from '@/types/product'

const FAMILY_ORDER = ['Composants Internes', 'Composants Externes', 'Accessoires']

interface FamilyGroup {
  name: string
  slug: string
  children: FlatCategory[]
}

function toFamily(parent: Category): FamilyGroup {
  return {
    name: parent.name,
    slug: parent.slug,
    children: (parent.children ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      parentName: parent.name,
    })),
  }
}

function buildFamilies(tree: Category[]): FamilyGroup[] {
  const families: FamilyGroup[] = []
  const seen = new Set<string>()
  for (const name of FAMILY_ORDER) {
    const parent = tree.find((c) => c.name === name)
    if (!parent) continue
    seen.add(parent.slug)
    families.push(toFamily(parent))
  }
  for (const parent of tree) {
    if (seen.has(parent.slug)) continue
    families.push(toFamily(parent))
  }
  return families
}

export default function CategoriesPage() {
  const { data: categoryTree, isLoading } = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await categoryService.getTree()).data,
  })

  const families = buildFamilies(categoryTree ?? [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-12">
        <h1 className="section-title mb-2">Toutes les catégories</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Parcourez les trois familles de composants PC : internes, externes et accessoires.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <CategoryShowcaseSkeleton key={i} count={6} />
          ))}
        </div>
      ) : (
        <div className="space-y-16">
          {families.map((family) => (
            <section key={family.slug} aria-labelledby={`family-${family.slug}`}>
              <div id={`family-${family.slug}`} className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display mb-1">
                  {family.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {family.children.length > 0
                    ? `${family.children.length} sous-catégories`
                    : 'Aucune sous-catégorie'}
                </p>
              </div>

              {family.children.length > 0 && (
                <CategoryShowcase categories={family.children} />
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
