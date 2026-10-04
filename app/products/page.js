'use client';
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import '@/styles/front-products.scss'

const FRAME_SHAPES = [
  { value: '', label: 'All Frames', emoji: '🕶️' },
  { value: 'Round', label: 'Round', emoji: '⭕' },
  { value: 'Square', label: 'Square', emoji: '🔲' },
  { value: 'Rectangle', label: 'Rectangle', emoji: '▬' },
  { value: 'Cat-Eye', label: 'Cat-Eye', emoji: '😺' },
  { value: 'Aviator', label: 'Aviator', emoji: '✈️' },
  { value: 'Oversized', label: 'Oversized', emoji: '🌕' },
  { value: 'Half-Rim', label: 'Half-Rim', emoji: '🌙' },
  { value: 'Transparent', label: 'Transparent', emoji: '💎' },
];

function AllProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('frame_type') || '');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const orderData = localStorage.getItem('orderInfo');
    if (orderData) {
      try { setSelectedProducts(JSON.parse(orderData)); } catch { }
    }
  }, []);

  useEffect(() => {
    if (selectedProducts.length > 0)
      localStorage.setItem('orderInfo', JSON.stringify(selectedProducts));
  }, [selectedProducts]);

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : '';
  }, [selectedProduct]);

  const fetchProducts = useCallback(async (frameShape, pageNum) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '24', page: String(pageNum) });
      if (frameShape) params.set('filter_type', frameShape);
      const res = await fetch(`/api/front-products?${params}`);
      const json = await res.json();
      if (json.data) {
        setProducts(json.data);
        setPagination(json.pagination || {});
      }
    } catch (err) {
      toast.error('Failed to load products');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setPage(1);
    fetchProducts(selectedFilter, 1);
  }, [selectedFilter]);

  useEffect(() => {
    fetchProducts(selectedFilter, page);
  }, [page]);

  const handleFilterChange = (val) => {
    setSelectedFilter(val);
    // update URL without full reload
    const url = val ? `/products?frame_type=${encodeURIComponent(val)}` : '/products';
    window.history.pushState({}, '', url);
  };

  const handleAddToCart = (productId, quantity) => {
    const selectPro = products.find(p => p.id === productId);
    if (!selectPro) return;
    const numQ = parseFloat(quantity);
    const total = numQ * selectPro.price;
    setSelectedProducts(prev => {
      let updated = prev.map(p =>
        p.title === selectPro.productTitle ? { ...p, quantity, proTotalPrice: total } : p
      );
      if (!quantity) {
        updated = updated.filter(p => p.title !== selectPro.productTitle);
      } else if (!prev.some(p => p.title === selectPro.productTitle)) {
        updated.push({
          id: selectPro.id, title: selectPro.productTitle,
          productImage: selectPro.productImage, price: selectPro.price,
          type: selectPro.type, quantity, proTotalPrice: total,
        });
      }
      return updated;
    });
    toast.success('Added to cart!', { position: 'top-center', autoClose: 2000 });
  };

  const handleWishlist = id => {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    toast.success('Wishlist updated!', { position: 'top-center', autoClose: 2000 });
  };

  const cartCount = selectedProducts.reduce((s, p) => s + Number(p.quantity || 0), 0);

  return (
    <>
     
      {/* NAV */}
      <nav className="ap-nav">
        <button className="ap-nav__back" onClick={() => router.push('/')}>
          ← Back to Home
        </button>
        <span className="ap-nav__title">All Eyewear</span>
        {cartCount > 0 ? (
          <button className="ap-nav__cart" onClick={() => router.push('/order-summary')}>
            🛒 Cart <span className="ap-nav__badge">{cartCount}</span>
          </button>
        ) : <div />}
      </nav>

      {/* HERO */}
      <div className="ap-hero">
        <div className="ap-hero__tag">Complete Collection</div>
        <h1>{selectedFilter ? `${selectedFilter} Frames` : 'All Eyewear'}</h1>
        <p>Discover premium frames crafted for every face and style</p>
      </div>

      {/* FILTERS */}
      <div className="ap-filters">
        {FRAME_SHAPES.map(shape => (
          <button
            key={shape.value}
            className={`ap-filter-btn ${selectedFilter === shape.value ? 'ap-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange(shape.value)}
          >
            <span>{shape.emoji}</span>
            {shape.label}
          </button>
        ))}
      </div>

      {/* RESULTS BAR */}
      {!isLoading && (
        <div className="ap-results-bar">
          <span>
            Showing <strong>{products.length}</strong> of <strong>{pagination.total || 0}</strong> products
            {selectedFilter && <> in <strong>{selectedFilter}</strong></>}
          </span>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
        </div>
      )}

      {/* PRODUCTS */}
      {isLoading ? (
        <div className="ap-loading">
          <div className="ap-spinner" />
          <p>Loading products…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="ap-empty">
          <div className="ap-empty__icon">🕶️</div>
          <h3>No products found</h3>
          <p>Try a different filter or check back later.</p>
        </div>
      ) : (
        <div className="ap-grid">
          {products.map(product => {
            const inCart = selectedProducts.find(p => p.id === product.id);
            const inWish = wishlist.includes(product.id);
            const disc = product.originalPrice > product.price
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0;
            return (
              <div className="ap-card" key={product.id} onClick={() => setSelectedProduct(product)}>
                <div className="ap-card__img-wrap">
                  {disc > 0 && <span className="ap-card__disc">{disc}% OFF</span>}
                  {product.frame_shape && <span className="ap-card__shape-badge">{product.frame_shape}</span>}
                  <img src={product.productImage} alt={product.productTitle} />
                  <button className="ap-card__wish"
                    onClick={e => { e.stopPropagation(); handleWishlist(product.id); }}>
                    {inWish ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="ap-card__body">
                  {product.brand && <div className="ap-card__brand">{product.brand}</div>}
                  <div className="ap-card__name">{product.productTitle}</div>
                  <div className="ap-card__price-row">
                    <span className="ap-card__price">₹{product.price}</span>
                    {product.originalPrice > product.price &&
                      <span className="ap-card__orig">₹{product.originalPrice}</span>}
                  </div>
                  <div className="ap-card__meta">
                    {product.frame_type && <span className="ap-card__pill">{product.frame_type}</span>}
                    {product.gender && <span className="ap-card__pill">{product.gender}</span>}
                    {product.lens_type && <span className="ap-card__pill">{product.lens_type}</span>}
                  </div>
                  {product.rating && (
                    <div className="ap-card__rating">⭐ {product.rating} ({product.reviewCount})</div>
                  )}
                  <div onClick={e => e.stopPropagation()}>
                    {inCart ? (
                      <div className="ap-qty">
                        <button onClick={() => {
                          if (inCart.quantity > 1) handleAddToCart(product.id, inCart.quantity - 1);
                          else handleAddToCart(product.id, '');
                        }}>−</button>
                        <span>{inCart.quantity}</span>
                        <button onClick={() => handleAddToCart(product.id, Number(inCart.quantity) + 1)}>+</button>
                      </div>
                    ) : (
                      <button className="ap-btn-cart" onClick={() => handleAddToCart(product.id, 1)}>
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <div className="ap-pagination">
          <button className="ap-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p < 1 || p > pagination.totalPages) return null;
            return (
              <button key={p}
                className={`ap-page-btn ${p === page ? 'ap-page-btn--active' : ''}`}
                onClick={() => setPage(p)}>{p}</button>
            );
          })}
          <button className="ap-page-btn" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}

      {/* FLOATING CART */}
      {cartCount > 0 && (
        <button className="ap-fab" onClick={() => router.push('/order-summary')}>
          🛒 <span>{cartCount} items</span> → View Cart
        </button>
      )}

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div className="ap-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <button className="ap-modal__close" onClick={() => setSelectedProduct(null)}>✕</button>
            <img className="ap-modal__img" src={selectedProduct.productImage} alt={selectedProduct.productTitle} />
            <div className="ap-modal__body">
              {selectedProduct.type && <span className="ap-modal__type">{selectedProduct.type}</span>}
              <div className="ap-modal__name">{selectedProduct.productTitle}</div>
              <div className="ap-modal__price-row">
                <span className="ap-modal__price">₹{selectedProduct.price}</span>
                {selectedProduct.originalPrice > selectedProduct.price && (
                  <>
                    <span className="ap-modal__orig">₹{selectedProduct.originalPrice}</span>
                    <span className="ap-modal__disc">
                      {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              <div className="ap-modal__specs">
                {selectedProduct.frame_shape && (
                  <div className="ap-modal__spec">
                    <div className="ap-modal__spec-label">Frame Shape</div>
                    <div className="ap-modal__spec-val">{selectedProduct.frame_shape}</div>
                  </div>
                )}
                {selectedProduct.frame_type && (
                  <div className="ap-modal__spec">
                    <div className="ap-modal__spec-label">Frame Type</div>
                    <div className="ap-modal__spec-val">{selectedProduct.frame_type}</div>
                  </div>
                )}
                {selectedProduct.frame_material && (
                  <div className="ap-modal__spec">
                    <div className="ap-modal__spec-label">Material</div>
                    <div className="ap-modal__spec-val">{selectedProduct.frame_material}</div>
                  </div>
                )}
                {selectedProduct.frame_color && (
                  <div className="ap-modal__spec">
                    <div className="ap-modal__spec-label">Color</div>
                    <div className="ap-modal__spec-val">{selectedProduct.frame_color}</div>
                  </div>
                )}
                {selectedProduct.lens_type && (
                  <div className="ap-modal__spec">
                    <div className="ap-modal__spec-label">Lens Type</div>
                    <div className="ap-modal__spec-val">{selectedProduct.lens_type}</div>
                  </div>
                )}
                {selectedProduct.gender && (
                  <div className="ap-modal__spec">
                    <div className="ap-modal__spec-label">Gender</div>
                    <div className="ap-modal__spec-val">{selectedProduct.gender}</div>
                  </div>
                )}
              </div>
              {selectedProduct.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
                  {selectedProduct.description}
                </p>
              )}
              {selectedProducts.some(p => p.id === selectedProduct.id) ? (
                <div className="ap-modal__qty">
                  <button onClick={() => {
                    const ex = selectedProducts.find(p => p.id === selectedProduct.id);
                    if (ex.quantity > 1) handleAddToCart(selectedProduct.id, ex.quantity - 1);
                    else handleAddToCart(selectedProduct.id, '');
                  }}>−</button>
                  <span>{selectedProducts.find(p => p.id === selectedProduct.id)?.quantity}</span>
                  <button onClick={() => {
                    const ex = selectedProducts.find(p => p.id === selectedProduct.id);
                    handleAddToCart(selectedProduct.id, Number(ex.quantity) + 1);
                  }}>+</button>
                </div>
              ) : (
                <button className="ap-modal__btn" onClick={() => handleAddToCart(selectedProduct.id, 1)}>
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Products() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AllProductsPage />
    </Suspense>
  );
}