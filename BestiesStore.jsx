import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";
import {
  Search, ShoppingCart, User, Phone,
  Facebook, Youtube, Instagram, MessageCircle,
  MapPin, X, Heart, Truck, Check, Send, Star
} from "lucide-react";

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
const CORAL = "#FF5A36";
const TEAL  = "#005A60";
const DARK  = "#1A1A1A";

/* ─── API ────────────────────────────────────────────────────────────────────── */
const API_URL = "http://localhost:3001";

const api = {
  fetchProducts: async ({ search = "", category = "all" } = {}) => {
    try {
      const params = new URLSearchParams({ search, category });
      const res = await fetch(`${API_URL}/api/products?${params}`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      await new Promise(r => setTimeout(r, 300));
      return PRODUCTS_DB.filter(p => {
        const okSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const okCat    = category === "all" || p.category === category;
        return okSearch && okCat;
      });
    }
  },
  checkout: async (items, customerName, customerEmail) => {
    const orderRef = `BST-${Date.now()}`;
    const total    = items.reduce((s, i) => s + i.price * i.qty, 0);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_ref:      orderRef,
          total,
          customer_name:  customerName  || "Cliente",
          customer_email: customerEmail || "cliente@besties.com",
          items: items.map(i => ({
            product_id: i.id,
            title: i.title,
            price: i.price,
            qty:   i.qty,
            emoji: i.emoji,
          })),
        }),
      });
      const data = await res.json();
      return { success: res.ok, orderId: data.order_ref || orderRef };
    } catch {
      await new Promise(r => setTimeout(r, 900));
      return { success: true, orderId: orderRef };
    }
  },
};

/* ─── HELPERS ────────────────────────────────────────────────────────────────── */
const brl = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── MOCK DATABASE (fallback se API offline) ───────────────────────────────── */
const PRODUCTS_DB = [
  { id:1,  title:"Premium Dog Food",   price:89.90,  emoji:"🐾", bg:"#FFF0EB", category:"dogs",          badge:"Best Seller" },
  { id:2,  title:"Cat Treats Deluxe",  price:16.99,  emoji:"😺", bg:"#F0EBFF", category:"cats",          badge:null          },
  { id:3,  title:"Bird Seed Mix",      price:24.50,  emoji:"🌾", bg:"#EBF0FF", category:"birds",         badge:"New"         },
  { id:4,  title:"Aquarium Flakes",    price:18.75,  emoji:"🐟", bg:"#EBF8FF", category:"fish",          badge:null          },
  { id:5,  title:"Hamster Pellets",    price:12.99,  emoji:"🐹", bg:"#FFF5EB", category:"small-animals", badge:null          },
  { id:6,  title:"Reptile Heat Lamp",  price:145.00, emoji:"🦎", bg:"#EBFFEF", category:"reptiles",      badge:"Pro"         },
  { id:7,  title:"Dog Dental Chews",   price:35.90,  emoji:"🦴", bg:"#FFF0EB", category:"dogs",          badge:"50% Off"     },
  { id:8,  title:"Premium Cat Litter", price:42.99,  emoji:"🏠", bg:"#F0EBFF", category:"cats",          badge:null          },
  { id:9,  title:"Puppy Shampoo",      price:29.90,  emoji:"🛁", bg:"#FFF0EB", category:"dogs",          badge:null          },
  { id:10, title:"Feather Cat Toy",    price:19.99,  emoji:"🪶", bg:"#F0EBFF", category:"cats",          badge:"New"         },
  { id:11, title:"Retractable Leash",  price:55.00,  emoji:"🦮", bg:"#FFF0EB", category:"dogs",          badge:null          },
  { id:12, title:"Aquarium Decor Set", price:38.99,  emoji:"🪸", bg:"#EBF8FF", category:"fish",          badge:null          },
];

const CATEGORIES = [
  { name:"SHOP ALL",        value:"all"          },
  { name:"DOGS",            value:"dogs"         },
  { name:"CATS",            value:"cats"         },
  { name:"BIRDS",           value:"birds"        },
  { name:"FISH & AQUATICS", value:"fish"         },
  { name:"SMALL ANIMALS",   value:"small-animals"},
  { name:"REPTILES",        value:"reptiles"     },
  { name:"CONTACT",         value:"contact"      },
];

const CAT_CARDS = [
  { label:"DEAL OF THE WEEK", sub:"50% Off on Dog Treats", emoji:"🐕",  value:"dogs",          grad:"linear-gradient(155deg,#111 0%,#3a1800 100%)" },
  { label:"Dogs",             sub:null,                    emoji:"🐕‍🦺", value:"dogs",          grad:"linear-gradient(155deg,#6b3a0a 0%,#c4891d 100%)" },
  { label:"Cats",             sub:null,                    emoji:"🐈",  value:"cats",          grad:"linear-gradient(155deg,#3b0d6e 0%,#8b3dc4 100%)" },
  { label:"Birds",            sub:null,                    emoji:"🦜",  value:"birds",         grad:"linear-gradient(155deg,#083060 0%,#1669b8 100%)" },
  { label:"Fish & Aquatics",  sub:null,                    emoji:"🐠",  value:"fish",          grad:"linear-gradient(155deg,#043328 0%,#0a7055 100%)" },
  { label:"Small Animals",    sub:null,                    emoji:"🐹",  value:"small-animals", grad:"linear-gradient(155deg,#4a1200 0%,#a03a08 100%)" },
  { label:"Reptiles",         sub:null,                    emoji:"🦎",  value:"reptiles",      grad:"linear-gradient(155deg,#0f3020 0%,#1d7042 100%)" },
];

const BRANDS = ["Le Bone","Furry Friend","Happy Paws","Zoo Zoo","Royals"];

/* ─── CART CONTEXT ──────────────────────────────────────────────────────────── */
const CartCtx = createContext(null);
const useCart = () => useContext(CartCtx);

function CartProvider({ children }) {
  const [cart,  setCart]  = useState([]);
  const [toast, setToast] = useState(null);

  const addItem = useCallback((product) => {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id);
      return found
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
    });
    setToast(`${product.title} adicionado!`);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const removeItem = useCallback((id) => setCart(p => p.filter(i => i.id !== id)), []);

  const updateQty = useCallback((id, delta) =>
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
          .filter(i => i.qty > 0)
    ), []);

  const clearCart = useCallback(() => setCart([]), []);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartCtx.Provider value={{ cart, addItem, removeItem, updateQty, clearCart, count, total, toast }}>
      {children}
    </CartCtx.Provider>
  );
}

/* ─── TOAST ─────────────────────────────────────────────────────────────────── */
function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return (
    <div className="fixed top-4 right-4 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"
         style={{ background: DARK, zIndex: 9999 }}>
      <Check size={15} style={{ color: "#4ade80" }} />
      {toast}
    </div>
  );
}

/* ─── ANNOUNCEMENT BANNER ───────────────────────────────────────────────────── */
function AnnouncementBanner() {
  return (
    <div style={{ background: TEAL }} className="py-2 text-center">
      <div className="flex items-center justify-center gap-3">
        <Truck size={13} className="text-white" style={{ opacity: 0.8 }} />
        <span className="text-white text-xs font-black tracking-widest uppercase">
          FRETE GRÁTIS — COMPRE HOJE
        </span>
        <Truck size={13} className="text-white" style={{ opacity: 0.8 }} />
      </div>
    </div>
  );
}

/* ─── HEADER ────────────────────────────────────────────────────────────────── */
function Header({ searchQuery, onSearchChange, onSearch }) {
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-6">
        <div className="flex-shrink-0">
          <div className="flex items-baseline gap-1">
            <span style={{ color: CORAL, letterSpacing: "0.06em" }} className="text-3xl font-black">
              BESTIES
            </span>
            <span className="text-2xl">🐾</span>
          </div>
          <p className="text-gray-400 font-bold tracking-widest uppercase" style={{ fontSize: "10px" }}>
            O Lugar Favorito do seu Pet
          </p>
        </div>

        <div className="flex flex-1 items-center max-w-lg mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch?.()}
            placeholder="Buscar produtos, marcas..."
            className="flex-1 border-2 border-gray-200 rounded-l-full pl-5 pr-3 py-2 text-sm font-medium outline-none"
            style={{ borderRight: "none" }}
          />
          <button
            onClick={onSearch}
            style={{ background: CORAL }}
            className="px-5 py-2 text-white rounded-r-full flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            <Search size={17} strokeWidth={2.5} />
          </button>
        </div>

        <a
          href="tel:1134567890"
          style={{ background: CORAL }}
          className="flex items-center gap-2 text-white px-5 py-2 rounded font-black text-sm whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          <Phone size={14} />
          (11) 3456-7890
        </a>
      </div>
    </header>
  );
}

/* ─── NAVBAR ────────────────────────────────────────────────────────────────── */
function Navbar({ active, onCategory, onCartOpen }) {
  const { count } = useCart();
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-screen-xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => onCategory(cat.value)}
              className="px-3 py-1 text-xs font-black tracking-wider rounded transition-all"
              style={{
                background: active === cat.value ? CORAL : "transparent",
                color:      active === cat.value ? "#fff" : "#444",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <button className="flex items-center gap-1 text-xs font-black tracking-wider text-gray-600 hover:text-gray-900 transition-colors">
            <User size={14} /> LOGIN
          </button>
          <button
            onClick={onCartOpen}
            className="flex items-center gap-1 text-xs font-black tracking-wider text-gray-600 hover:text-gray-900 transition-colors relative"
          >
            <span className="relative">
              <ShoppingCart size={17} />
              {count > 0 && (
                <span
                  className="absolute text-white font-black rounded-full flex items-center justify-center"
                  style={{
                    background: CORAL, top: "-10px", right: "-10px",
                    minWidth: "16px", height: "16px", fontSize: "9px", padding: "0 3px",
                  }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            CARRINHO
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────────────── */
function HeroSection({ onShop, onBrands }) {
  return (
    <section className="bg-white py-20 px-6 overflow-hidden relative">
      <div className="absolute rounded-full pointer-events-none"
           style={{ background: CORAL, opacity: 0.06, width: 420, height: 420, right: "-80px", top: "50%", transform: "translateY(-50%)" }} />
      <div className="absolute rounded-full pointer-events-none"
           style={{ background: TEAL, opacity: 0.05, width: 260, height: 260, right: "160px", bottom: "-80px" }} />

      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: CORAL }}>
            🐾 Seu pet merece o melhor
          </p>
          <h1 className="text-6xl font-black mb-6" style={{ color: DARK, lineHeight: 1.05 }}>
            Bem-vindo à<br />
            Nossa{" "}
            <span style={{ color: CORAL }}>Loja Pet</span>
            <br />Online.
          </h1>
          <p className="text-gray-500 text-base font-medium mb-8 leading-relaxed" style={{ maxWidth: 380 }}>
            Tudo o que seus amigos de quatro patas, com penas e com escamas precisam — entregue na sua porta.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onShop}
              style={{ background: CORAL }}
              className="text-white px-8 py-3 font-black text-sm tracking-widest rounded hover:opacity-90 transition-opacity"
            >
              COMPRAR AGORA
            </button>
            <button
              onClick={onBrands}
              style={{ border: `2px solid ${DARK}`, color: DARK }}
              className="px-8 py-3 font-black text-sm tracking-widest rounded hover:bg-gray-50 transition-colors"
            >
              VER MARCAS
            </button>
          </div>
          <div className="flex items-center gap-3 mt-8">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={14} fill={CORAL} style={{ color: CORAL }} />
              ))}
            </div>
            <span className="text-sm text-gray-400 font-medium">+10.000 pets e tutores felizes</span>
          </div>
        </div>

        <div className="flex flex-col items-center" style={{ marginRight: "60px" }}>
          <div className="text-9xl select-none" style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.12))", lineHeight: 1 }}>
            🐕
          </div>
          <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1">
            <span style={{ color: CORAL }} className="font-black text-sm">4.9</span>
            <span className="text-gray-300 text-xs">|</span>
            <span className="text-gray-400 text-xs font-medium">Pet store mais bem avaliada</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 self-center">
          {[
            { Icon: Facebook,  href: "#" },
            { Icon: Youtube,   href: "#" },
            { Icon: Instagram, href: "#" },
          ].map(({ Icon, href }) => (
            <a key={Icon.displayName} href={href}
               className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <Icon size={15} style={{ color: "#888" }} />
            </a>
          ))}
          <div style={{ height: 56, width: 1, background: "#e5e7eb" }} />
          <p className="text-gray-300 font-black text-xs tracking-widest uppercase"
             style={{ writingMode: "vertical-rl" }}>
            Siga-nos
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── CATEGORY GRID ─────────────────────────────────────────────────────────── */
function CategoryGrid({ onCategory }) {
  const rows = [
    { cards: CAT_CARDS.slice(0, 3), cols: 3, h: 260 },
    { cards: CAT_CARDS.slice(3, 5), cols: 2, h: 220 },
    { cards: CAT_CARDS.slice(5, 7), cols: 2, h: 220 },
  ];

  return (
    <section className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="flex flex-col gap-3">
        {rows.map((row, ri) => (
          <div key={ri}
               style={{ display: "grid", gridTemplateColumns: `repeat(${row.cols}, 1fr)`, gap: "12px" }}>
            {row.cards.map(card => (
              <div
                key={card.label}
                onClick={() => onCategory(card.value)}
                className="cat-card relative rounded-xl overflow-hidden cursor-pointer"
                style={{ height: row.h, background: card.grad }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="cat-emoji select-none" style={{ fontSize: 80, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))" }}>
                    {card.emoji}
                  </span>
                </div>
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {card.sub && (
                    <p className="font-black text-xs tracking-widest uppercase mb-1" style={{ color: CORAL }}>
                      {card.sub}
                    </p>
                  )}
                  <p className="text-white font-black text-xl mb-3" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                    {card.label}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); onCategory(card.value); }}
                    style={{ background: CORAL }}
                    className="text-white px-4 py-1 text-xs font-black tracking-widest rounded hover:opacity-90 transition-opacity"
                  >
                    VER PRODUTOS
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── PRODUCT CARD ───────────────────────────────────────────────────────────── */
function ProductCard({ product }) {
  const { addItem }      = useCart();
  const [added,   setAdded]   = useState(false);
  const [liked,   setLiked]   = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="product-card bg-white rounded-xl overflow-hidden flex flex-col"
         style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
      <div className="relative flex items-center justify-center" style={{ height: 152, background: product.bg }}>
        {product.badge && (
          <span className="absolute top-2 left-2 text-white font-black rounded-full px-2"
                style={{ background: CORAL, fontSize: "9px", letterSpacing: "0.05em", paddingTop: 2, paddingBottom: 2 }}>
            {product.badge}
          </span>
        )}
        <span className="select-none" style={{ fontSize: 60, lineHeight: 1 }}>{product.emoji}</span>
        <button
          onClick={() => setLiked(v => !v)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center transition-all"
          style={{ opacity: 0.9 }}
        >
          <Heart size={13} fill={liked ? CORAL : "none"} style={{ color: liked ? CORAL : "#bbb" }} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-center font-medium text-gray-400 mb-1"
           style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {product.category.replace(/-/g, " ")}
        </p>
        <h3 className="text-sm font-black text-gray-900 text-center mb-2 leading-tight">
          {product.title}
        </h3>
        <p className="text-lg font-black text-center mb-4" style={{ color: CORAL }}>
          {brl(product.price)}
        </p>
        <button
          onClick={handleAdd}
          className="w-full mt-auto py-2 text-xs font-black tracking-widest rounded flex items-center justify-center gap-1 transition-all"
          style={{ background: added ? "#16a34a" : DARK, color: "#fff" }}
        >
          {added
            ? <><Check size={12} /> ADICIONADO!</>
            : <><ShoppingCart size={12} /> ADICIONAR</>
          }
        </button>
      </div>
    </div>
  );
}

/* ─── PRODUCTS SECTION ───────────────────────────────────────────────────────── */
function ProductsSection({ searchQuery, active, onShopAll }) {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAll,  setShowAll]  = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => {
    setLoading(true);
    setShowAll(false);
    api.fetchProducts({ search: debouncedSearch, category: active }).then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, [debouncedSearch, active]);

  const shown = showAll ? products : products.slice(0, 8);

  return (
    <section id="products" className="py-14 px-6" style={{ background: "#F9F9F9" }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: CORAL }}>
            Selecionados para os seus pets
          </p>
          <h2 className="text-4xl font-black" style={{ color: CORAL }}>Escolhas dos Pets</h2>
          {(debouncedSearch || active !== "all") && !loading && (
            <p className="text-sm text-gray-400 mt-2">
              {products.length} resultado{products.length !== 1 ? "s" : ""}
              {debouncedSearch ? ` para "${debouncedSearch}"` : ""}
              {active !== "all" ? ` em ${active.replace(/-/g," ")}` : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl animate-pulse" style={{ height: 260 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 font-bold">Nenhum produto encontrado.</p>
            <button onClick={onShopAll} className="mt-4 text-sm font-black hover:underline" style={{ color: CORAL }}>
              Ver todos os produtos →
            </button>
          </div>
        ) : (
          <div className="products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
            {shown.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {!loading && products.length > 8 && (
          <div className="flex justify-center gap-4 mt-10">
            <button
              onClick={() => setShowAll(v => !v)}
              style={{ background: DARK }}
              className="text-white px-10 py-3 font-black text-xs tracking-widest rounded hover:opacity-80 transition-opacity"
            >
              {showAll ? "VER MENOS" : "VER MAIS"}
            </button>
            <button
              onClick={onShopAll}
              style={{ background: CORAL }}
              className="text-white px-10 py-3 font-black text-xs tracking-widest rounded hover:opacity-90 transition-opacity"
            >
              TODOS OS PRODUTOS
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── BRANDS ─────────────────────────────────────────────────────────────────── */
function BrandsSection() {
  return (
    <section id="brands" style={{ background: "#F4F4F4" }} className="py-12 px-6">
      <div className="max-w-screen-xl mx-auto text-center">
        <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: CORAL }}>
          Aprovado pelos tutores
        </p>
        <h2 className="text-2xl font-black mb-8" style={{ color: CORAL }}>
          Melhores Marcas pelo Menor Preço
        </h2>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {BRANDS.map(b => (
            <span
              key={b}
              className="font-black text-lg tracking-widest uppercase cursor-pointer transition-colors hover:text-gray-500"
              style={{ color: "#d0d0d0", letterSpacing: "0.15em" }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────────── */
function Footer({ onCategory }) {
  const [email,      setEmail]      = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer id="contact" style={{ background: CORAL }} className="pt-12 pb-6 px-6">
      <div className="max-w-screen-xl mx-auto"
           style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40 }}>
        <div className="text-white">
          <h3 className="font-black text-base uppercase tracking-widest mb-4">Nossa Loja</h3>
          <div className="flex items-start gap-2 text-sm mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>
            <MapPin size={13} className="text-white flex-shrink-0" />
            <p>Rua dos Pets, 123, Centro<br />São Paulo, SP 01001-000</p>
          </div>
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
            <Phone size={13} className="text-white flex-shrink-0" />
            <span>(11) 3456-7890</span>
          </div>
          <a href="#" className="text-sm font-bold text-white" style={{ borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
            Ver todas as lojas →
          </a>
        </div>

        <div className="text-white">
          <h3 className="font-black text-base uppercase tracking-widest mb-4">Categorias</h3>
          <ul className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
            {["Dogs","Cats","Birds","Fish & Aquatics","Small Animals","Reptiles"].map(c => (
              <li key={c}>
                <button
                  onClick={() => onCategory(c.toLowerCase().replace(/ & /g, "").replace(/ /g, "-"))}
                  className="hover:text-white transition-colors font-medium text-left"
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-white">
          <h3 className="font-black text-base uppercase tracking-widest mb-4">Informações</h3>
          <ul className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
            {["Nossa História","Contato","Envio & Devoluções","FAQ","Política de Privacidade","Termos de Serviço"].map(l => (
              <li key={l}>
                <a href="#" className="hover:text-white transition-colors font-medium">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-white">
          <h3 className="font-black text-base uppercase tracking-widest mb-2">Ofertas Exclusivas</h3>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
            Cadastre-se e receba descontos especiais!
          </p>
          {subscribed ? (
            <div className="flex items-center gap-2 text-sm font-black">
              <Check size={16} /> Obrigado! Você está na lista. 🐾
            </div>
          ) : (
            <div className="flex gap-2 mb-5">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                placeholder="Seu e-mail..."
                className="flex-1 bg-white text-gray-900 px-3 py-2 text-sm rounded outline-none font-medium"
                style={{ minWidth: 0 }}
              />
              <button
                onClick={handleSubscribe}
                style={{ background: DARK }}
                className="text-white px-4 py-2 text-xs font-black tracking-wider rounded hover:opacity-80 transition-opacity flex-shrink-0"
              >
                OK
              </button>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            {[Facebook, Youtube, Instagram].map((Icon, i) => (
              <a key={i} href="#"
                 className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                 style={{ background: "rgba(255,255,255,0.2)" }}>
                <Icon size={15} className="text-white" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto mt-8 pt-5 flex items-center justify-between"
           style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
        <p className="text-white font-black tracking-wider">BESTIES 🐾</p>
        <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
          © 2026 Besties Pet Store. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

/* ─── CART SIDEBAR ───────────────────────────────────────────────────────────── */
function CartSidebar({ open, onClose }) {
  const { cart, removeItem, updateQty, clearCart, total } = useCart();
  const [checking,  setChecking]  = useState(false);
  const [order,     setOrder]     = useState(null);
  const [custName,  setCustName]  = useState("");
  const [custEmail, setCustEmail] = useState("");

  const handleCheckout = async () => {
    if (!cart.length) return;
    setChecking(true);
    const res = await api.checkout(cart, custName, custEmail);
    setChecking(false);
    if (res.success) { setOrder(res); clearCart(); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 9998 }}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative bg-white flex flex-col shadow-2xl" style={{ width: 384, height: "100%" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-black text-lg flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: CORAL }} /> Carrinho
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X size={15} />
          </button>
        </div>

        {order ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check size={30} style={{ color: "#16a34a" }} />
            </div>
            <h3 className="font-black text-xl mb-2">Pedido Realizado! 🎉</h3>
            <p className="text-gray-500 text-sm mb-1">Seu pedido foi processado com sucesso!</p>
            <p className="text-xs text-gray-400 mb-6 font-mono">ID: {order.orderId}</p>
            <button
              style={{ background: CORAL }}
              onClick={() => { setOrder(null); onClose(); }}
              className="text-white px-8 py-3 font-black text-sm tracking-wider rounded hover:opacity-90 transition-opacity"
            >
              Continuar Comprando
            </button>
          </div>

        ) : cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-7xl mb-4" style={{ opacity: 0.25 }}>🛒</div>
            <p className="text-gray-400 font-bold text-sm">Seu carrinho está vazio.</p>
            <button onClick={onClose} className="mt-4 text-sm font-black hover:underline" style={{ color: CORAL }}>
              Começar a comprar →
            </button>
          </div>

        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl p-3"
                     style={{ border: "1px solid #f0f0f0" }}>
                  <div className="rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                       style={{ width: 52, height: 52, background: item.bg }}>
                    {item.emoji}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <p className="text-sm font-black text-gray-900 truncate">{item.title}</p>
                    <p className="text-sm font-black" style={{ color: CORAL }}>{brl(item.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQty(item.id, -1)}
                              className="w-6 h-6 rounded-full bg-gray-100 text-xs font-black flex items-center justify-center hover:bg-gray-200 transition-colors">−</button>
                      <span className="text-sm font-black w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)}
                              className="w-6 h-6 rounded-full bg-gray-100 text-xs font-black flex items-center justify-center hover:bg-gray-200 transition-colors">+</button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t" style={{ background: "#fafafa" }}>
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none font-medium"
                />
                <input
                  type="email"
                  value={custEmail}
                  onChange={e => setCustEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none font-medium"
                />
              </div>

              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500 font-medium">Subtotal</span>
                <span className="text-sm font-black">{brl(total)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500 font-medium">Frete</span>
                <span className="text-sm font-black text-green-600">GRÁTIS</span>
              </div>
              <div className="flex justify-between items-center mb-4 pt-3" style={{ borderTop: "1px solid #e5e7eb" }}>
                <span className="font-black text-lg">Total</span>
                <span className="font-black text-lg" style={{ color: CORAL }}>{brl(total)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checking}
                style={{ background: CORAL, opacity: checking ? 0.7 : 1 }}
                className="w-full text-white py-3 font-black text-sm tracking-widest rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {checking
                  ? <><span className="animate-spin inline-block">⏳</span> Processando...</>
                  : "FINALIZAR COMPRA →"
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── CHAT WIDGET ────────────────────────────────────────────────────────────── */
function ChatWidget() {
  const [open,  setOpen]  = useState(false);
  const [msgs,  setMsgs]  = useState([{ from: "bot", text: "Olá! 🐾 Como posso ajudar você hoje?" }]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    const msg = input.trim();
    if (!msg) return;
    setMsgs(m => [...m, { from: "user", text: msg }]);
    setInput("");
    setTimeout(() => {
      setMsgs(m => [...m, {
        from: "bot",
        text: `Obrigado pela mensagem! Nossa equipe entrará em contato em breve sobre "${msg}". 🐕`,
      }]);
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3" style={{ zIndex: 9990 }}>
      {open && (
        <div className="bg-white rounded-2xl overflow-hidden"
             style={{ width: 288, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", border: "1px solid #f0f0f0" }}>
          <div style={{ background: CORAL }} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: "rgba(255,255,255,0.2)" }}>🐾</div>
              <div>
                <p className="text-white font-black text-sm">BESTIES Chat</p>
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Online agora</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: "rgba(255,255,255,0.7)" }} className="hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="p-3 space-y-2 overflow-y-auto" style={{ height: 200, background: "#f9f9f9" }}>
            {msgs.map((m, i) => (
              <div key={i} className="flex" style={{ justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div className="max-w-xs px-3 rounded-xl text-xs font-medium"
                     style={m.from === "user"
                       ? { background: CORAL, color: "#fff", paddingTop: 6, paddingBottom: 6 }
                       : { background: "#fff", color: "#333", border: "1px solid #eee", paddingTop: 6, paddingBottom: 6 }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex border-t">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-3 py-2 text-xs font-medium outline-none"
            />
            <button onClick={send} style={{ background: CORAL }} className="px-3 text-white hover:opacity-90 transition-opacity">
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ background: CORAL }}
        className="flex items-center gap-2 px-5 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageCircle size={17} className="text-white" />
        <span className="text-white font-black text-sm">Fale conosco</span>
      </button>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────────── */
export default function BestiesApp() {
  const [search,   setSearch]   = useState("");
  const [active,   setActive]   = useState("all");
  const [cartOpen, setCartOpen] = useState(false);

  const handleCategory = (cat) => {
    if (cat === "contact") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setActive(cat);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleShopAll = () => {
    setActive("all");
    setSearch("");
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <CartProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Montserrat', sans-serif !important; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .product-card { transition: box-shadow 0.25s, transform 0.25s; }
        .product-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.14) !important; transform: translateY(-3px); }

        .cat-card .cat-emoji { transition: transform 0.3s ease; display: inline-block; }
        .cat-card:hover .cat-emoji { transform: scale(1.18); }

        @media (max-width: 1024px) { .products-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 768px)  { .products-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 480px)  { .products-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <Toast />

      <div className="min-h-screen bg-white">
        <AnnouncementBanner />

        <Header
          searchQuery={search}
          onSearchChange={val => { setSearch(val); setActive("all"); }}
          onSearch={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
        />

        <Navbar
          active={active}
          onCategory={handleCategory}
          onCartOpen={() => setCartOpen(true)}
        />

        <HeroSection
          onShop={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
          onBrands={() => document.getElementById("brands")?.scrollIntoView({ behavior: "smooth" })}
        />

        <CategoryGrid onCategory={handleCategory} />

        <ProductsSection searchQuery={search} active={active} onShopAll={handleShopAll} />

        <BrandsSection />

        <Footer onCategory={handleCategory} />

        <ChatWidget />

        <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </CartProvider>
  );
}
