import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { productService, categoryService } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import ImageUploadZone from '@/components/ImageUploadZone'
import type { AttributeDefinition, ProductCreatePayload, ProductImage } from '@/types/product'

const CONDITIONS = [
  { value: 'NEUF', label: 'Neuf' },
  { value: 'OCCASION', label: 'Occasion' },
  { value: 'RECONDITIONNE', label: 'Reconditionné' },
  { value: 'UTILISE', label: 'Utilisé' },
]

const MAX_IMAGES = 5

interface FormState {
  title: string
  model: string
  description: string
  price: string
  condition: string
  city: string
  commune: string
  phone: string
  whatsapp: string
  category_id: string
  brand_id: string
}

const EMPTY_FORM: FormState = {
  title: '',
  model: '',
  description: '',
  price: '',
  condition: 'NEUF',
  city: 'Abidjan',
  commune: '',
  phone: '',
  whatsapp: '',
  category_id: '',
  brand_id: '',
}

export default function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedParentId, setSelectedParentId] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [attrValues, setAttrValues] = useState<Record<string, unknown>>({})
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [deletedImages, setDeletedImages] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [reordering, setReordering] = useState(false)
  const [error, setError] = useState('')

  const { data: tree } = useQuery({
    queryKey: ['category-tree'],
    queryFn: async () => (await categoryService.getTree()).data,
  })
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await categoryService.getBrands()).data,
  })
  const { data: product } = useQuery({
    queryKey: ['my-product', id],
    queryFn: async () => (await productService.getMyProduct(id!)).data,
    enabled: isEdit,
  })
  const { data: attributes } = useQuery({
    queryKey: ['category-attributes', categorySlug],
    queryFn: async () => (await categoryService.getAttributes(categorySlug)).data,
    enabled: !!categorySlug,
  })

  useEffect(() => {
    if (isEdit && product && tree) {
      let parentId = ''
      for (const top of tree) {
        if (top.id === product.category_id) parentId = top.id
        if (top.children?.some((c) => c.id === product.category_id)) parentId = top.id
      }
      setForm({
        title: product.title,
        model: product.model,
        description: product.description,
        price: String(product.price),
        condition: product.condition,
        city: product.city,
        commune: product.commune,
        phone: product.phone,
        whatsapp: product.whatsapp,
        category_id: product.category_id ?? '',
        brand_id: product.brand_id ?? '',
      })
      setSelectedParentId(parentId)
      setCategorySlug(product.category_slug ?? '')
      setExistingImages(product.images ?? [])
    }
  }, [isEdit, product, tree])

  useEffect(() => {
    if (isEdit && product && attributes) {
      const initial: Record<string, unknown> = {}
      for (const a of product.attributes) {
        const def = attributes.find((d) => d.key === a.key)
        if (def) initial[def.id] = a.value
      }
      setAttrValues(initial)
    }
  }, [isEdit, product, attributes])

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload: ProductCreatePayload = {
        title: form.title.trim(),
        category_id: form.category_id,
        brand_id: form.brand_id || undefined,
        model: form.model || undefined,
        description: form.description || undefined,
        price: Number(form.price),
        condition: form.condition,
        city: form.city || undefined,
        commune: form.commune || undefined,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
      }
      const productId =
        isEdit && product ? product.id : (await productService.createProduct(payload)).data.id
      const filled = visibleAttributes.filter((def) => {
        const v = attrValues[def.id]
        if (Array.isArray(v)) return v.length > 0
        return v !== undefined && v !== '' && v !== false
      })
      if (filled.length > 0) {
        await productService.setAttributes(
          productId,
          filled.map((def) => ({
            attribute: def.id,
            value:
              def.value_type === 'number' ? Number(attrValues[def.id]) : attrValues[def.id],
          }))
        )
      }
      if (imageFiles.length > 0) {
        await productService.uploadImages(productId, imageFiles)
      }
      for (const imageId of deletedImages) {
        await productService.deleteImage(productId, imageId)
      }
      if (existingImages.length > 1) {
        await productService.reorderImages(
          productId,
          existingImages.map((img) => img.id)
        )
      }
    },
    onSuccess: () => {
      void navigate('/seller/products')
    },
    onError: (err) => setError(getErrorMessage(err)),
  })

  const missingRequired = visibleAttributes.some((def) => {
    if (!def.required) return false
    const v = attrValues[def.id]
    if (Array.isArray(v)) return v.length === 0
    return v === undefined || v === '' || v === false
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim() || !form.category_id || !form.price) {
      setError('Veuillez remplir le titre, la catégorie et le prix.')
      return
    }
    if (missingRequired) {
      setError('Veuillez remplir toutes les caractéristiques obligatoires.')
      return
    }
    submitMutation.mutate()
  }

  const handleParentChange = (value: string) => {
    setSelectedParentId(value)
    const top = (tree ?? []).find((c) => c.id === value)
    if (top && (top.children ?? []).length === 0) {
      setForm({ ...form, category_id: top.id })
      setCategorySlug(top.slug)
    } else {
      setForm({ ...form, category_id: '' })
    }
    setCategorySlug('')
    setAttrValues({})
  }

  const handleChildChange = (value: string) => {
    const children = (tree ?? []).find((c) => c.id === selectedParentId)?.children ?? []
    const child = children.find((c) => c.id === value)
    setForm({ ...form, category_id: value })
    setCategorySlug(child?.slug ?? '')
    setAttrValues({})
  }

  const handleDeleteExisting = async (imageId: string) => {
    if (!product) return
    setDeletingIds((prev) => [...prev, imageId])
    try {
      await productService.deleteImage(product.id, imageId)
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
      setDeletedImages((prev) => [...prev, imageId])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== imageId))
    }
  }

  const handleReorderExisting = async (order: string[]) => {
    setReordering(true)
    const current = [...existingImages]
    const reordered = order
      .map((id) => current.find((img) => img.id === id))
      .filter((img): img is ProductImage => !!img)
    const primaryId = reordered[0]?.id
    const withPrimary = reordered.map((img) => ({
      ...img,
      is_primary: img.id === primaryId,
    }))
    setExistingImages(withPrimary)
    try {
      if (product) await productService.reorderImages(product.id, order)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setReordering(false)
    }
  }

  const attrLabel = (def: AttributeDefinition) =>
    `${def.label}${def.unit ? ' (' + def.unit + ')' : ''}`

  /**
   * Storage auto-hide (spec §19): fields irrelevant to the selected storage
   * type are hidden. e.g. RPM for an NVMe SSD, PCIe gen for an HDD.
   */
  const STORAGE_VISIBILITY: Record<string, Record<string, string[]>> = {
    'SSD NVMe': {
      hidden: ['rpm'],
    },
    'SSD SATA': {
      hidden: ['rpm', 'pcie_gen', 'nand'],
    },
    HDD: {
      hidden: ['pcie_gen', 'read_speed', 'write_speed', 'dram', 'tbw', 'nand'],
    },
  }

  const isAttributeVisible = (def: AttributeDefinition): boolean => {
    const storageType = Object.entries(attrValues).find(([defId]) => {
      const d = (attributes ?? []).find((a) => a.id === defId)
      return d?.key === 'storage_type'
    })?.[1] as string | undefined
    if (!storageType || !categorySlug || categorySlug !== 'stockage') return true
    const rule = STORAGE_VISIBILITY[storageType]
    if (!rule) return true
    return !rule.hidden.includes(def.key)
  }

  const visibleAttributes = (attributes ?? []).filter(isAttributeVisible)

  const renderAttributeField = (def: AttributeDefinition) => {
    const value = attrValues[def.id]
    if (def.value_type === 'boolean') {
      return (
        <label
          key={def.id}
          className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => setAttrValues({ ...attrValues, [def.id]: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          {attrLabel(def)}
        </label>
      )
    }
    if (def.value_type === 'multiselect') {
      const selected = Array.isArray(value) ? (value as string[]) : []
      return (
        <div key={def.id}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {attrLabel(def)} {def.required && <span className="text-red-500">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {(def.options ?? []).map((opt) => {
              const checked = (Array.isArray(value) ? value : []).includes(opt)
              return (
                <label
                  key={opt}
                  className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
                    checked
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={(e) => {
                      const current = Array.isArray(attrValues[def.id])
                        ? (attrValues[def.id] as string[])
                        : []
                      setAttrValues({
                        ...attrValues,
                        [def.id]: e.target.checked
                          ? [...current, opt]
                          : current.filter((x) => x !== opt),
                      })
                    }}
                  />
                  {opt}
                </label>
              )
            })}
          </div>
        </div>
      )
    }
    if (def.value_type === 'select') {
      return (
        <div key={def.id}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {attrLabel(def)} {def.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => setAttrValues({ ...attrValues, [def.id]: e.target.value })}
            className="input-field"
          >
            <option value="">--</option>
            {(def.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )
    }
    return (
      <div key={def.id}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {attrLabel(def)} {def.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={def.value_type === 'number' ? 'number' : 'text'}
          value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
          onChange={(e) => setAttrValues({ ...attrValues, [def.id]: e.target.value })}
          className="input-field"
        />
      </div>
    )
  }

  if (isEdit && !product) {
    return <div className="p-8 text-gray-400">Chargement...</div>
  }

  const parent = (tree ?? []).find((c) => c.id === selectedParentId)
  const children = parent?.children ?? []

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/seller/products"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            {isEdit ? 'Modifier le produit' : 'Ajouter un produit'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Annonce gratuite, visible sur votre boutique.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre de l&apos;annonce <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="Ex: RTX 4070 Super + i7-14700K bundle"
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {"Catégorie"} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => handleParentChange(e.target.value)}
                className="input-field"
              >
                <option value="">{"Sélectionnez..."}</option>
                {(tree ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {children.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {"Sous-catégorie"} <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => handleChildChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">{"Sélectionnez..."}</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marque
              </label>
              <select
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                className="input-field"
              >
                <option value="">--</option>
                {(brands ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {"Modèle"}
              </label>
              <input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="input-field"
                placeholder="RTX 4070 Gaming X Trio"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="input-field resize-none"
              placeholder="Etat, accessoires inclus, garantie, livraison..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input-field"
                placeholder="450000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {"État"}
              </label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                className="input-field"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            {"Caractéristiques"}
          </h2>
          {!categorySlug ? (
            <p className="text-sm text-gray-400">
              {"Choisissez une catégorie pour voir les champs spécifiques."}
            </p>
          ) : attributes && attributes.length === 0 ? (
            <p className="text-sm text-gray-400">
              {"Aucune caractéristique définie pour cette catégorie."}
            </p>
          ) : (
            <div className="space-y-4">{visibleAttributes.map(renderAttributeField)}</div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Photos</h2>
          <p className="text-sm text-gray-400 mb-3">
            {"Jusqu'à"} {MAX_IMAGES} images (JPG, PNG, WebP). La première image est la photo principale.
          </p>
          <ImageUploadZone
            existing={existingImages}
            files={imageFiles}
            maxImages={MAX_IMAGES}
            onFilesChange={setImageFiles}
            onDeleteExisting={handleDeleteExisting}
            onReorderExisting={handleReorderExisting}
            deletingIds={deletingIds}
            reordering={reordering}
          />
        </div>

        <div className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {"Téléphone"}
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              placeholder="+2250708091011"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              WhatsApp
            </label>
            <input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="input-field"
              placeholder="+2250708091011"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ville
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input-field"
              placeholder="Abidjan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Commune
            </label>
            <input
              value={form.commune}
              onChange={(e) => setForm({ ...form, commune: e.target.value })}
              className="input-field"
              placeholder="Cocody"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary px-8 inline-flex items-center gap-2" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Publication...
              </>
            ) : (
              'Publier le produit'
            )}
          </button>
          <Link to="/seller/products" className="btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  )
}
