import { useState, useCallback, useEffect, useRef, createContext, useContext } from "react";
import {
  Search, ShoppingCart, User, Phone,
  Facebook, Youtube, Instagram, MessageCircle,
  MapPin, X, Heart, Truck, Check, Send,
  Star
} from "lucide-react";

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
const CORAL = "#FF5A36";
const TEAL  = "#005A60";
const DARK  = "#1A1A1A";

/* ─── HELPERS ───────────────────────────────────────────────────────────────── */
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

/* ─── TYPES ─────────────────────────────────────────────────────────────────── */
interface Product {
  id: number;
  title: string;
  price: number;
  emoji: string;
  bg: string;
  category: string;
  badge: string | null;
}

interface CartItem extends Product {
  qty: number;
}

interface CartContextType {
  cart: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, delta: number) => void;
  clearCart: () => void;
  count: number;
  total: number;
  toast: string | null;
}

/* ─── MOCK DATABASE ─────────────────────────────────────────────────────────── */
const PRODUCTS_DB: Product[] = [
  { id:1,  title:"Premium Dog Food",     price:89.90,  emoji:"🐕",  bg:"#FFF0EB", category:"dogs",          badge:"Best Seller" },
  { id:2,  title:"Cat Treats Deluxe",    price:16.99,  emoji:"🐈",  bg:"#F0EBFF", category:"cats",          badge:null          },
  { id:3,  title:"Bird Seed Mix",        price:24.50,  emoji:"🦜",  bg:"#EBF0FF", category:"birds",         badge:"New"         },
  { id:4,  title:"Aquarium Flakes",      price:18.75,  emoji:"🐟",  bg:"#EBF8FF", category:"fish",          badge:null          },
  { id:5,  title:"Hamster Pellets",      price:12.99,  emoji:"🐹",  bg:"#FFF5EB", category:"small-animals", badge:null          },
  { id:6,  title:"Reptile Heat Lamp",    price:145.00, emoji:"🦎",  bg:"#EBFFEF", category:"reptiles",      badge:"Pro"         },
  { id:7,  title:"Dog Dental Chews",     price:35.90,  emoji:"🦴",  bg:"#FFF0EB", category:"dogs",          badge:"50% Off"     },
  { id:8,  title:"Premium Cat Litter",   price:42.99,  emoji:"🪣",  bg:"#F0EBFF", category:"cats",          badge:null          },
  { id:9,  title:"Puppy Shampoo",        price:29.90,  emoji:"🛁",  bg:"#FFF0EB", category:"dogs",          badge:null          },
  { id:10, title:"Feather Cat Toy",      price:19.99,  emoji:"🧶",  bg:"#F0EBFF", category:"cats",          badge:"New"         },
  { id:11, title:"Retractable Leash",    price:55.00,  emoji:"🔗",  bg:"#FFF0EB", category:"dogs",          badge:null          },
  { id:12, title:"Aquarium Decor Set",   price:38.99,  emoji:"🐠",  bg:"#EBF8FF", category:"fish",          badge:null          },
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

const BRANDS = ["Le Bone","furry friend","Happy Paws","ZOO ZOO","Royals"];

/* ─── SIMULATED API ─────────────────────────────────────────────────────────── */
const api = {
  fetchProducts: async ({ search = "", category = "all" } = {}) => {
    await new Promise(r => setTimeout(r, 350));
    return PRODUCTS_DB.filter(p => {
      const okSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const okCat    = category === "all" || p.category === category;
      return okSearch && okCat;
    });
  },
  checkout: async (_items: CartItem[]) => {
    await new Promise(r => setTimeout(r, 900));
    return {
      success: true,
      message: "Order processed successfully!",
      orderId: `BST-${Date.now()}`,
    };
  },
};

/* ─── CART CONTEXT ──────────────────────────────────────────────────────────── */
const CartCtx = createContext<CartContextType | null>(null);
const useCart = () => useContext(CartCtx)!;

function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const addItem = useCallback((product: Product) => {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id);
      return found
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
    });
    setToast(`✓  ${product.title} added!`);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const removeItem = useCallback((id: number) => setCart(p => p.filter(i => i.id !== id)), []);

  const updateQty = useCallback((id: number, delta: number) =>
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
    <div
      className="fixed top-4 right-4 z-50 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"
      style={{ background: DARK, zIndex: 9999 }}
    >
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
          FREE SHIPPING — ORDER TODAY
        </span>
        <Truck size={13} className="text-white" style={{ opacity: 0.8 }} />
      </div>
    </div>
  );
}

/* ─── HEADER ────────────────────────────────────────────────────────────────── */
function Header({ searchQuery, onSearchChange }: { searchQuery: string; onSearchChange: (v: string) => void }) {
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
          <p className="text-xs text-gray-400 font-bold tracking-widest uppercase" style={{ fontSize: "10px" }}>
            A Pet's Favorite Place
          </p>
        </div>

        <div className="flex flex-1 items-center max-w-lg mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search products, brands..."
            className="flex-1 border-2 border-gray-200 border-r-0 rounded-l-full pl-5 pr-3 py-2 text-sm font-medium outline-none"
            style={{ borderRight: "none" }}
          />
          <button
            style={{ background: CORAL }}
            className="px-5 py-2 text-white rounded-r-full flex-shrink-0 hover:opacity-90 transition-opacity"
          >
            <Search size={17} strokeWidth={2.5} />
          </button>
        </div>

        <a
          href="tel:1234567890"
          style={{ background: CORAL }}
          className="flex items-center gap-2 text-white px-5 py-2 rounded font-black text-sm whitespace-nowrap hover:opacity-90 transition-opacity"
        >
          <Phone size={14} />
          Call Us 123-456-7890
        </a>
      </div>
    </header>
  );
}

/* ─── NAVBAR ────────────────────────────────────────────────────────────────── */
function Navbar({ active, onCategory, onCartOpen }: { active: string; onCategory: (c: string) => void; onCartOpen: () => void }) {
  const { count } = useCart();
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-screen-xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => cat.value !== "contact" && onCategory(cat.value)}
              className="px-3 py-1 text-xs font-black tracking-wider rounded transition-all"
              style={{
                background:  active === cat.value ? CORAL : "transparent",
                color:       active === cat.value ? "#fff" : "#444",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <button className="flex items-center gap-1 text-xs font-black tracking-wider text-gray-600 hover:text-gray-900 transition-colors">
            <User size={14} />LOGIN
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
                    background: CORAL,
                    top: "-10px", right: "-10px",
                    minWidth: "16px", height: "16px",
                    fontSize: "9px", lineHeight: 1, padding: "0 3px",
                  }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            CART
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────────────────────────────────────── */
function HeroSection({ onShop }: { onShop: () => void }) {
  return (
    <section className="bg-white py-20 px-6 overflow-hidden relative">
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          background: CORAL, opacity: 0.06,
          width: 420, height: 420,
          right: "-80px", top: "50%", transform: "translateY(-50%)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          background: TEAL, opacity: 0.05,
          width: 260, height: 260,
          right: "160px", bottom: "-80px",
        }}
      />

      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-black tracking-widest uppercase mb-4" style={{ color: CORAL }}>
            🐾 Your pets deserve the best
          </p>
          <h1 className="text-6xl font-black leading-tight mb-6" style={{ color: DARK, lineHeight: 1.05 }}>
            Welcome to<br />
            Our{" "}
            <span style={{ color: CORAL }}>Pet Supply</span>
            <br />Shop.
          </h1>
          <p className="text-gray-500 text-base font-medium mb-8 leading-relaxed" style={{ maxWidth: 380 }}>
            Everything your furry, feathered, and finned friends need — delivered right to your door.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onShop}
              style={{ background: CORAL }}
              className="text-white px-8 py-3 font-black text-sm tracking-widest rounded hover:opacity-90 transition-opacity"
            >
              START SHOPPING
            </button>
            <button
              style={{ border: `2px solid ${DARK}`, color: DARK }}
              className="px-8 py-3 font-black text-sm tracking-widest rounded hover:bg-gray-50 transition-colors"
            >
              VIEW BRANDS
            </button>
          </div>
          <div className="flex items-center gap-3 mt-8">
            <div className="flex">
              {["★","★","★","★","★"].map((s,i) => (
                <span key={i} style={{ color: CORAL }} className="text-sm">{s}</span>
              ))}
            </div>
            <span className="text-sm text-gray-400 font-medium">10,000+ happy pets & owners</span>
          </div>
        </div>

        <div className="flex flex-col items-center" style={{ marginRight: "60px" }}>
          <div className="text-9xl select-none" style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.12))", lineHeight: 1 }}>
            🐕
          </div>
          <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1">
            <span style={{ color: CORAL }} className="font-black text-sm">4.9</span>
            <span className="text-gray-300 text-xs">|</span>
            <span className="text-gray-400 text-xs font-medium">Top-rated pet store</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 self-center">
          {[
            { Icon: Facebook,  href: "#" },
            { Icon: Youtube,   href: "#" },
            { Icon: Instagram, href: "#" },
          ].map(({ Icon, href }, idx) => (
            <a
              key={idx}
              href={href}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Icon size={15} style={{ color: "#888" }} />
            </a>
          ))}
          <div style={{ height: 56, width: 1, background: "#e5e7eb" }} />
          <p
            className="text-gray-300 font-black text-xs tracking-widest uppercase"
            style={{ writingMode: "vertical-rl" }}
          >
            Follow Us
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── CATEGORY GRID ─────────────────────────────────────────────────────────── */
function CategoryGrid({ onCategory }: { onCategory: (c: string) => void }) {
  const rows = [
    { cards: CAT_CARDS.slice(0, 3), cols: 3, h: 260 },
    { cards: CAT_CARDS.slice(3, 5), cols: 2, h: 220 },
    { cards: CAT_CARDS.slice(5, 7), cols: 2, h: 220 },
  ];

  return (
    <section className="max-w-screen-xl mx-auto px-6 py-10">
      <div className="flex flex-col gap-3">
        {rows.map((row, ri) => (
          <div
            key={ri}
            style={{ display: "grid", gridTemplateColumns: `repeat(${row.cols}, 1fr)`, gap: "12px" }}
          >
            {row.cards.map(card => (
              <div
                key={card.label}
                onClick={() => onCategory(card.value)}
                className="relative rounded-xl overflow-hidden cursor-pointer group"
                style={{ height: row.h, background: card.grad }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="select-none"
                    style={{
                      fontSize: 80,
                      filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    {card.emoji}
                  </span>
                </div>
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }}
                />
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
                    SHOP NOW
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
function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "box-shadow 0.25s" }}>
      <div className="relative flex items-center justify-center" style={{ height: 152, background: product.bg }}>
        {product.badge && (
          <span
            className="absolute top-2 left-2 text-white font-black rounded-full px-2 py-0"
            style={{ background: CORAL, fontSize: "9px", letterSpacing: "0.05em", paddingTop: 2, paddingBottom: 2 }}
          >
            {product.badge}
          </span>
        )}
        <span className="select-none" style={{ fontSize: 60, lineHeight: 1 }}>
          {product.emoji}
        </span>
        <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center" style={{ opacity: 0.8 }}>
          <Heart size={13} style={{ color: "#bbb" }} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-center font-medium text-gray-400 mb-1" style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
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
          style={{
            background: added ? "#16a34a" : DARK,
            color: "#fff",
          }}
        >
          {added
            ? (<><Check size={12} /> ADDED!</>)
            : (<><ShoppingCart size={12} /> ADD TO CART</>)
          }
        </button>
      </div>
    </div>
  );
}

/* ─── PRODUCTS SECTION ───────────────────────────────────────────────────────── */
function ProductsSection({ searchQuery, active }: { searchQuery: string; active: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    setShowAll(false);
    api.fetchProducts({ search: searchQuery, category: active }).then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, [searchQuery, active]);

  const shown = showAll ? products : products.slice(0, 8);

  return (
    <section id="products" className="py-14 px-6" style={{ background: "#F9F9F9" }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: CORAL }}>
            Hand-picked for your pets
          </p>
          <h2 className="text-4xl font-black" style={{ color: CORAL }}>Our Pets' Choice</h2>
          {(searchQuery || active !== "all") && !loading && (
            <p className="text-sm text-gray-400 mt-2">
              {products.length} result{products.length !== 1 ? "s" : ""}
              {searchQuery ? ` for "${searchQuery}"` : ""}
              {active !== "all" ? ` in ${active}` : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl animate-pulse" style={{ height: 260 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 font-bold">No products found.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
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
              {showAll ? "SHOW LESS" : "SHOW MORE"}
            </button>
            <button
              style={{ background: CORAL }}
              className="text-white px-10 py-3 font-black text-xs tracking-widest rounded hover:opacity-90 transition-opacity"
            >
              SHOP ALL
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
    <section style={{ background: "#F4F4F4" }} className="py-12 px-6">
      <div className="max-w-screen-xl mx-auto text-center">
        <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: CORAL }}>
          Trusted by pet lovers
        </p>
        <h2 className="text-2xl font-black mb-8" style={{ color: CORAL }}>
          Best Brands at Lowest Prices
        </h2>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {BRANDS.map(b => (
            <span
              key={b}
              className="font-black text-lg tracking-widest uppercase cursor-pointer hover:text-gray-500 transition-colors"
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
function Footer() {
  return (
    <footer style={{ background: CORAL }} className="pt-12 pb-6 px-6">
      <div className="max-w-screen-xl mx-auto" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40 }}>
        <div className="text-white">
          <h3 className="font-black text-base uppercase tracking-widest mb-4">Our Flagship Store</h3>
          <div className="flex items-start gap-2 text-sm mb-3" style={{ color: "rgba(255,255,255,0.8)" }}>
            <MapPin size={13} className="text-white flex-shrink-0 mt-0" />
            <p>123 Pet Street, Animal District<br />São Paulo, SP 01001-000</p>
          </div>
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
            <Phone size={13} className="text-white flex-shrink-0" />
            <span>123-456-7890</span>
          </div>
          <a href="#" className="text-sm font-bold text-white" style={{ borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
            View Stores List →
          </a>
        </div>

        <div className="text-white">
          <h3 className="font-black text-base uppercase tracking-widest mb-4">Shop</h3>
          <ul className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
            {["Dogs","Cats","Birds","Fish & Aquatics","Small Animals","Reptiles"].map(c => (
              <li key={c}>
                <a href="#" className="hover:text-white transition-colors font-medium">{c}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-white">
          <h3 className="font-black text-base uppercase tracking-widest mb-4">Info</h3>
          <ul className="space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
            {["Our Story","Contact","Shipping & Returns","FAQ","Privacy Policy","Terms of Service"].map(l => (
              <li key={l}>
                <a href="#" className="hover:text-white transition-colors font-medium">{l}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-white">
          <h3 className="font-black text-base uppercase tracking-widest mb-2">Get Special Deals & Offers</h3>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
            Join our newsletter for exclusive discounts!
          </p>
          <div className="flex gap-2 mb-5">
            <input
              type="email"
              placeholder="Your email..."
              className="flex-1 bg-white text-gray-900 px-3 py-2 text-sm rounded outline-none font-medium"
              style={{ minWidth: 0 }}
            />
            <button
              style={{ background: DARK }}
              className="text-white px-4 py-2 text-xs font-black tracking-wider rounded hover:opacity-80 transition-opacity flex-shrink-0"
            >
              Subscribe
            </button>
          </div>
          <div className="flex gap-3">
            {[Facebook, Youtube, Instagram].map((Icon, i) => (
              <a
                key={i} href="#"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <Icon size={15} className="text-white" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div
        className="max-w-screen-xl mx-auto mt-8 pt-5 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}
      >
        <p className="text-white font-black tracking-wider">BESTIES 🐾</p>
        <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
          © 2025 Besties Pet Store. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ─── CART SIDEBAR ───────────────────────────────────────────────────────────── */
function CartSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, removeItem, updateQty, clearCart, total } = useCart();
  const [checking, setChecking] = useState(false);
  const [order, setOrder] = useState<{ success: boolean; message: string; orderId: string } | null>(null);

  const handleCheckout = async () => {
    if (!cart.length) return;
    setChecking(true);
    const res = await api.checkout(cart);
    setChecking(false);
    if (res.success) { setOrder(res); clearCart(); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ zIndex: 9998 }}>
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={onClose}
      />
      <div className="relative bg-white flex flex-col shadow-2xl" style={{ width: 384, height: "100%" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-black text-lg flex items-center gap-2">
            <ShoppingCart size={18} style={{ color: CORAL }} />
            Shopping Cart
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
            <h3 className="font-black text-xl mb-2">Order Placed! 🎉</h3>
            <p className="text-gray-500 text-sm mb-1">Order processed successfully!</p>
            <p className="text-xs text-gray-400 mb-6">Order ID: {order.orderId}</p>
            <button
              style={{ background: CORAL }}
              onClick={() => { setOrder(null); onClose(); }}
              className="text-white px-8 py-3 font-black text-sm tracking-wider rounded hover:opacity-90 transition-opacity"
            >
              Continue Shopping
            </button>
          </div>

        ) : cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-7xl mb-4" style={{ opacity: 0.25 }}>🛒</div>
            <p className="text-gray-400 font-bold text-sm">Your cart is empty.</p>
            <button
              onClick={onClose}
              className="mt-4 text-sm font-black hover:underline"
              style={{ color: CORAL }}
            >
              Start shopping →
            </button>
          </div>

        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ border: "1px solid #f0f0f0" }}
                >
                  <div
                    className="rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ width: 52, height: 52, background: item.bg }}
                  >
                    {item.emoji}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <p className="text-sm font-black text-gray-900 truncate">{item.title}</p>
                    <p className="text-sm font-black" style={{ color: CORAL }}>{brl(item.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-gray-100 text-xs font-black flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >−</button>
                      <span className="text-sm font-black w-4 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 text-xs font-black flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >+</button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t" style={{ background: "#fafafa" }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500 font-medium">Subtotal</span>
                <span className="text-sm font-black">{brl(total)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500 font-medium">Shipping</span>
                <span className="text-sm font-black text-green-600">FREE</span>
              </div>
              <div
                className="flex justify-between items-center mb-4 pt-3"
                style={{ borderTop: "1px solid #e5e7eb" }}
              >
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
                  ? (<><span className="animate-spin inline-block">⏳</span> Processing...</>)
                  : "CHECKOUT →"
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
interface ChatMsg { from: "bot" | "user"; text: string; }

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { from: "bot", text: "Hello! 🐾 How can we help you today?" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = () => {
    const msg = input.trim();
    if (!msg) return;
    setMsgs(m => [...m, { from: "user", text: msg }]);
    setInput("");
    setTimeout(() => {
      setMsgs(m => [...m, {
        from: "bot",
        text: `Thank you for your message! Our team will get back to you shortly about "${msg}". 🐕`,
      }]);
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3" style={{ zIndex: 9990 }}>
      {open && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ width: 288, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", border: "1px solid #f0f0f0" }}>
          <div style={{ background: CORAL }} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: "rgba(255,255,255,0.2)" }}>🐾</div>
              <div>
                <p className="text-white font-black text-sm">BESTIES Chat</p>
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Online now</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: "rgba(255,255,255,0.7)" }} className="hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="p-3 space-y-2 overflow-y-auto" style={{ height: 160, background: "#f9f9f9" }}>
            {msgs.map((m, i) => (
              <div key={i} className="flex" style={{ justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div
                  className="max-w-xs px-3 py-1 rounded-xl text-xs font-medium"
                  style={
                    m.from === "user"
                      ? { background: CORAL, color: "#fff", paddingTop: 6, paddingBottom: 6 }
                      : { background: "#fff", color: "#333", border: "1px solid #eee", paddingTop: 6, paddingBottom: 6 }
                  }
                >
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
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 text-xs font-medium outline-none"
            />
            <button
              onClick={send}
              style={{ background: CORAL }}
              className="px-3 text-white hover:opacity-90 transition-opacity"
            >
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
        <span className="text-white font-black text-sm">Chat with us</span>
      </button>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────────── */
export default function App() {
  const [search, setSearch]     = useState("");
  const [active, setActive]     = useState("all");
  const [cartOpen, setCartOpen] = useState(false);

  const handleCategory = (cat: string) => {
    setActive(cat);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <CartProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Montserrat', sans-serif !important; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>

      <Toast />

      <div className="min-h-screen bg-white">
        <AnnouncementBanner />

        <Header
          searchQuery={search}
          onSearchChange={val => { setSearch(val); setActive("all"); }}
        />

        <Navbar
          active={active}
          onCategory={handleCategory}
          onCartOpen={() => setCartOpen(true)}
        />

        <HeroSection
          onShop={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
        />

        <CategoryGrid onCategory={handleCategory} />

        <ProductsSection searchQuery={search} active={active} />

        <BrandsSection />

        <Footer />

        <ChatWidget />

        <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </CartProvider>
  );
}
