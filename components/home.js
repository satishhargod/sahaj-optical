'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function SahajOptical() {
  const router = useRouter();

  // Slider
  const [current, setCurrent] = useState(0);
  const images = [
     '/slider/img1.jpg',
    '/slider/img2.jpg',
    '/slider/img3.jpg',
    '/slider/img4.jpg',
    '/slider/img5.jpg',
    // '/slider/img6.jpg',
    // '/slider/img7.jpg',
  ];
  useEffect(() => {
    const t = setInterval(() => setCurrent(p => (p + 1) % images.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Products
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  // Customer Form
  const [showForm, setShowForm] = useState(false);
  const [userName, setUserName] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userGender, setUserGender] = useState('');

  // Nav
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      const u = JSON.parse(stored);
      setUserName(u.name || '');
      setUserMobile(u.mobile || '');
      setUserAddress(u.address || '');
      setUserGender(u.gender || '');
    } else {
      setShowForm(true);
    }
    fetchProducts();
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
    document.body.style.overflow = selectedProduct || showForm ? 'hidden' : '';
  }, [selectedProduct, showForm]);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/front-products?limit=20'); // ← limit=20 add karo
      const { data } = await res.json();
      if (data?.length) setProducts(data);
    } catch { }
    setIsLoading(false);
  }

  const categories = ['All', ...Array.from(new Set(products.map(p => p.type || 'Other')))];

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter(p => (p.type || 'Other') === activeCategory);

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

  const handleFormSubmit = async () => {
    if (!userName.trim() || !userMobile.trim()) {
      toast.error('Please enter Name and Mobile Number');
      return;
    }
    if (!/^\d{10}$/.test(userMobile)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    const payload = { name: userName, mobile: userMobile, address: userAddress, gender: userGender };
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    localStorage.setItem('userInfo', JSON.stringify(payload));
    setShowForm(false);
    toast.success('Profile saved!', { position: 'top-center', autoClose: 2000 });
  };

  const cartCount = selectedProducts.reduce((s, p) => s + Number(p.quantity || 0), 0);

  const glassShapes = [
    { img: '/sahaj-img/Round Frames.avif', label: 'Round', value: 'Round' },
    { img: '/sahaj-img/Square Frames.webp', label: 'Square', value: 'Square' },
    { img: '/sahaj-img/Cat-Eye Frames.webp', label: 'Cat-Eye', value: 'Cat-Eye' },
    { img: '/sahaj-img/Aviator Frames.jpg', label: 'Aviator', value: 'Aviator' },
    { img: '/sahaj-img/Rectangle Frames.webp', label: 'Rectangle', value: 'Rectangle' },
    { img: '/sahaj-img/Transparent Frames.webp', label: 'Transparent', value: 'Transparent' },
    { img: '/sahaj-img/Oversized Frames.webp', label: 'Oversized', value: 'Oversized' },
    { img: '/sahaj-img/Half-Rim Frames.webp', label: 'Half-Rim', value: 'Half-Rim' },
  ];

  const trending = [
    { img: '/sahaj-img/Classic Black Frames.avif', label: 'Classic Black' },
    { img: '/sahaj-img/Transparent Frames w.webp', label: 'Transparent' },
    { img: '/sahaj-img/Metal Finish Frames.avif', label: 'Metal Finish' },
    { img: '/sahaj-img/Stylish Round Frames.jpg', label: 'Stylish Round' },
    { img: '/sahaj-img/Round Frames w.avif', label: 'Round Frames' },
    { img: '/sahaj-img/Rectangle Frames.jpg', label: 'Rectangle' },
    { img: '/sahaj-img/Half-Rim Frames w.webp', label: 'Half-Rim' },
    { img: '/sahaj-img/Oversized Frames.avif', label: 'Oversized' },
  ];

  return (
    <>
      {/* ── NAVBAR ── */}
      <header className={`so-nav ${scrolled ? 'so-nav--scrolled' : ''}`}>
        <a href="#home" className="so-nav__brand">
          <img src="./nlogo.png" alt="Sahaj Optical" className="so-nav__logo" />
          <span className="so-nav__name">SAHAJ OPTICAL</span>
        </a>

        <button className="so-nav__burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <nav className={`so-nav__links ${menuOpen ? 'so-nav__links--open' : ''}`}>
          {['home', 'about', 'contact'].map(id => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
          <a href="#" onClick={e => { e.preventDefault(); setShowForm(true); setMenuOpen(false); }}>
            My Profile
          </a>
          <a href="#" className="so-nav__cart" onClick={e => { e.preventDefault(); router.push('/order-summary'); }}>
            🛒
            {cartCount > 0 && <span className="so-nav__badge">{cartCount}</span>}
          </a>
        </nav>
      </header>

      {/* ── HERO SLIDER ── */}
      <section className="so-hero" id="home">
        <div className="so-slider">
          {images.map((img, i) => (
            <img key={i} src={img} alt="banner"
              className={`so-slider__img ${i === current ? 'so-slider__img--active' : ''}`} />
          ))}
          <div className="so-slider__overlay" />
          <div className="so-slider__content">
            <p className="so-slider__sub">Premium Eyewear Store</p>
            <h1 className="so-slider__title">SAHAJ OPTICAL</h1>
            <p className="so-slider__tagline">See the World in Style</p>
            <div className="so-slider__btns">
              <a href="#products" className="so-btn so-btn--primary">Shop Now</a>
              {/* <a href="#eyetest" className="so-btn so-btn--ghost">Book Eye Test</a> */}
              <a
  href="https://wa.me/919617093363?text=Hello%20Sahaj%20Optical,%20I%20want%20to%20book%20an%20eye%20test."
  target="_blank"
  rel="noopener noreferrer"
  className="so-btn so-btn--primary"
>
  Book Eye Test
</a>
            </div>
          </div>
        </div>
        <div className="so-slider__dots">
          {images.map((_, i) => (
            <button key={i} className={`so-dot ${i === current ? 'so-dot--active' : ''}`}
              onClick={() => setCurrent(i)} />
          ))}
        </div>
      </section>

      {/* ── EYE TEST ── */}
      <section className="so-eyetest" id="eyetest">
        <div className="so-eyetest__badge">Eye Care</div>
        <div className="so-eyetest__inner">
          <div className="so-eyetest__text">
            <h2>Advanced <span>Eye Testing</span></h2>
            <p className="so-eyetest__highlight">Accurate vision starts with a professional examination.</p>
            <p className="so-eyetest__desc">
              At <strong>Sahaj Optical</strong>, we use modern equipment to ensure precise results
              and personalized eye-care. Our expert examination detects vision issues early and
              provides the perfect lens recommendation for your comfort.
            </p>
            <button
  className="so-btn so-btn--primary"
  onClick={() =>
    window.open(
      "https://wa.me/919617093363?text=Hello%20Sahaj%20Optical,%20I%20want%20to%20book%20an%20eye%20test.",
      "_blank"
    )
  }
>
  Book Eye Test →
</button>
          </div>
          <div className="so-eyetest__img-wrap">
            <img src="/sahaj-img/rrtest.jpg" alt="Eye Test at Sahaj Optical" />
          </div>
        </div>
      </section>

      {/* ── SHAPES ── */}
      {/* <section className="so-shapes">
        <div className="so-section-head">
          <h3>Find Your Perfect Frame</h3>
          <p>Explore our collection by shape</p>
        </div>
        <div className="so-scroll-row">
          {glassShapes.map((g, i) => (
            <div className="so-shape-card" key={i}>
              <div className="so-shape-card__img-wrap">
                <img src={g.img} alt={g.label} />
              </div>
              <p>{g.label}</p>
            </div>
          ))}
        </div>
      </section> */}
      <section className="so-shapes">
        <div className="so-section-head">
          <h3>Find Your Perfect Frame</h3>
          <p>Explore our collection by shape</p>
        </div>
        <div className="so-scroll-row">
          {glassShapes.map((g, i) => (
            <div
              className="so-shape-card"
              key={i}
              onClick={() => router.push(`/products?frame_shape=${encodeURIComponent(g.value)}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="so-shape-card__img-wrap">
                <img src={g.img} alt={g.label} />
              </div>
              <p>{g.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BANNER ── */}
      <div className="so-full-banner">
        <img src="/sahaj-img/50befa0cd46f47e18cf4c1a5999753ac.jpg" alt="Sahaj Optical Banner" />
        <div className="so-full-banner__text">
          <h3>Style Meets Clarity</h3>
          <p>Premium lenses, handpicked frames</p>
        </div>
      </div>

      {/* ── TRENDING ── */}
      <section className="so-trending">
        <div className="so-section-head">
          <h3>Trending Now</h3>
          <p>Most loved styles this season</p>
        </div>
        <div className="so-scroll-row so-scroll-row--trending">
          {trending.map((t, i) => (
            <div className="so-trend-card" key={i}>
              <img src={t.img} alt={t.label} />
              <div className="so-trend-card__label">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="so-products" id="products">
        <div className="so-section-head">
          <h3>Our Products</h3>
          <p>Browse our full eyewear collection</p>
          <button
            onClick={() => router.push('/products')}
            style={{
              marginTop: '12px',
              background: 'transparent',
              border: '1px solid currentColor',
              borderRadius: '50px',
              padding: '8px 24px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            View All Products →
          </button>
        </div>

        {/* Category Tabs */}
        <div className="so-cats">
          {categories.map(cat => (
            <button key={cat}
              className={`so-cat-btn ${activeCategory === cat ? 'so-cat-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="so-loading">
            <div className="so-spinner" />
            <p>Loading products…</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="so-empty">No products found in this category.</div>
        ) : (
          <div className="so-product-grid">
            {filteredProducts.map(product => {
              const inCart = selectedProducts.find(p => p.id === product.id);
              const inWish = wishlist.includes(product.id);
              const disc = product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;
              return (
                <div className="so-prod-card" key={product.id} onClick={() => setSelectedProduct(product)}>
                  <div className="so-prod-card__img-wrap">
                    {disc > 0 && <span className="so-prod-card__disc">{disc}% OFF</span>}
                    <img src={product.productImage} alt={product.productTitle} />
                    <button className="so-prod-card__wish"
                      onClick={e => { e.stopPropagation(); handleWishlist(product.id); }}>
                      {inWish ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="so-prod-card__info">
                    <p className="so-prod-card__title">{product.productTitle}</p>
                    <div className="so-prod-card__price-row">
                      <span className="so-prod-card__price">₹{product.price}</span>
                      {product.originalPrice > product.price &&
                        <span className="so-prod-card__orig">₹{product.originalPrice}</span>}
                    </div>
                    {product.rating && (
                      <div className="so-prod-card__rating">
                        ⭐ {product.rating} <span>({product.reviewCount})</span>
                      </div>
                    )}
                    <div onClick={e => e.stopPropagation()}>
                      {inCart ? (
                        <div className="so-qty-btns">
                          <button onClick={() => {
                            if (inCart.quantity > 1) handleAddToCart(product.id, inCart.quantity - 1);
                            else handleAddToCart(product.id, '');
                          }}>−</button>
                          <span>{inCart.quantity}</span>
                          <button onClick={() => handleAddToCart(product.id, Number(inCart.quantity) + 1)}>+</button>
                        </div>
                      ) : (
                        <button className="so-btn so-btn--add"
                          onClick={() => handleAddToCart(product.id, 1)}>
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
      </section>

      {/* ── ABOUT ── */}
      <section className="so-about" id="about">
        <div className="so-about__inner">
          <div className="so-about__deco">👁️</div>
          <h2>About Sahaj Optical</h2>
          <p>
            Sahaj Optical is a trusted optical store dedicated to providing high-quality eyewear,
            precision lenses, and reliable eye-care solutions. We offer a wide range of stylish
            frames combined with accurate eye testing to ensure clear and comfortable vision.
          </p>
          <p>
            Our goal is to deliver the perfect balance of comfort, clarity, and style.
            With expert guidance and customer-focused service, Sahaj Optical ensures every
            customer finds eyewear that truly fits their needs.
          </p>
          <div className="so-about__stats">
            <div><strong>500+</strong><span>Happy Customers</span></div>
            <div><strong>100+</strong><span>Frame Styles</span></div>
            <div><strong>5★</strong><span>Avg Rating</span></div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="so-footer" id="contact">
        <div className="so-footer__inner">
          <div className="so-footer__col">
            <h4>Sahaj Optical</h4>
            <p>Trusted optical store providing quality eyewear, precision lenses, and reliable eye-care solutions.</p>
          </div>
          <div className="so-footer__col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#products">Products</a></li>
              <li><a href="#" onClick={e => { e.preventDefault(); setShowForm(true); }}>My Profile</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
          <div className="so-footer__col">
            <h4>Contact Us</h4>
            <p>📍 Safire Sector, Kalindi Gold City,<br />S-48, Bhawrasla, Indore, MP 453111</p>
            <p>📞 +91 98765 43210</p>
            <p>✉️ support@sahajoptical.com</p>
          </div>
        </div>
        <div className="so-footer__bottom">
          © {new Date().getFullYear()} Sahaj Optical. All rights reserved. |  Developed By Satish Hargod | Mo. <a href="tel:+918602148689">+918602148689</a>
        </div>
      </footer>

      {/* ── FLOATING CART ── */}
      {cartCount > 0 && (
        <button className="so-fab" onClick={() => router.push('/order-summary')}>
          🛒 <span className="so-fab__count">{cartCount}</span>
          <span className="so-fab__label">View Cart</span>
        </button>
      )}

      {/* ── PRODUCT MODAL ── */}
      {selectedProduct && (
        <div className="so-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="so-modal" onClick={e => e.stopPropagation()}>
            <button className="so-modal__close" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="so-modal__img-wrap">
              <img src={selectedProduct.productImage} alt={selectedProduct.productTitle} />
              <button className="so-modal__wish" onClick={() => handleWishlist(selectedProduct.id)}>
                {wishlist.includes(selectedProduct.id) ? '❤️' : '🤍'}
              </button>
            </div>
            <div className="so-modal__body">
              <h2>{selectedProduct.productTitle}</h2>
              {selectedProduct.type && <span className="so-modal__type">{selectedProduct.type}</span>}
              <div className="so-modal__price-row">
                <span className="so-modal__price">₹{selectedProduct.price}</span>
                {selectedProduct.originalPrice > selectedProduct.price && (
                  <>
                    <span className="so-modal__orig">₹{selectedProduct.originalPrice}</span>
                    <span className="so-modal__disc">
                      {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              {selectedProduct.rating && (
                <div className="so-modal__rating">
                  ⭐ {selectedProduct.rating} &nbsp;
                  <span>({selectedProduct.reviewCount} reviews)</span>
                </div>
              )}
              {selectedProduct.note && <p><strong>Note:</strong> {selectedProduct.note}</p>}
              {selectedProduct.description && <p><strong>Description:</strong> {selectedProduct.description}</p>}

              <div className="so-modal__action">
                {selectedProducts.some(p => p.id === selectedProduct.id) ? (
                  <div className="so-qty-btns so-qty-btns--lg">
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
                  <button className="so-btn so-btn--primary so-btn--full"
                    onClick={() => handleAddToCart(selectedProduct.id, 1)}>
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER FORM ── */}
      {showForm && (
        <div className="so-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="so-form-modal" onClick={e => e.stopPropagation()}>
            <button className="so-modal__close" onClick={() => setShowForm(false)}>✕</button>
            <div className="so-form-modal__head">
              <div className="so-form-modal__icon">👤</div>
              <h2>Your Profile</h2>
              <p>Help us serve you better</p>
            </div>
            <div className="so-form-modal__body">
              <label>
                Full Name *
                <input type="text" placeholder="Enter your name"
                  value={userName} onChange={e => setUserName(e.target.value)} />
              </label>
              <label>
                Mobile Number *
                <input type="tel" placeholder="10-digit mobile"
                  value={userMobile} onChange={e => setUserMobile(e.target.value)} maxLength={10} />
              </label>
              <label>
                Address
                <textarea placeholder="Your delivery address"
                  value={userAddress} onChange={e => setUserAddress(e.target.value)} rows={3} />
              </label>
              <label>Gender</label>
              <div className="so-gender-btns">
                {['Male', 'Female', 'Other'].map(g => (
                  <button key={g}
                    className={`so-gender-btn ${userGender === g ? 'so-gender-btn--active' : ''}`}
                    onClick={() => setUserGender(g)}>
                    {g === 'Male' ? '👨' : g === 'Female' ? '👩' : '🧑'} {g}
                  </button>
                ))}
              </div>
              <button className="so-btn so-btn--primary so-btn--full so-form-modal__submit"
                onClick={handleFormSubmit}>
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}