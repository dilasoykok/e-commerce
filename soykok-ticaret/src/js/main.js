// Stiller ve font <head> içindeki <link> ile yüklenir (bkz. partials/head.html)

import {
  createIcons,
  // Header
  Truck, ShieldCheck, Headset, User, Search, Heart, ShoppingCart,
  Menu, ChevronDown, ChevronRight, X, ArrowRight, ArrowLeft, MessagesSquare,
  // Kategoriler
  Layers, Ruler, FlaskConical, LayoutGrid, BrickWall, Building2, Sofa, Boxes,
  // Bölümler
  Package, Star, SwatchBook, Building, Mail,
  // Footer
  MapPin, Phone, Clock, Lock,
  // Ödeme
  CircleCheck, CreditCard, Landmark, Store, Info,
  // Hesap
  Eye, EyeOff, UserPlus, LogIn, LogOut,
  // Hakkımızda
  Target, Award, Handshake, Users, Leaf,
  // Mağaza
  Navigation, MessageCircle,
  // İletişim
  Send,
  // Ürünler
  SlidersHorizontal, SearchX,
    // Ürün detay
  Calculator,
} from 'lucide';

import { initPreloader } from './modules/preloader.js';
import { initMegaMenu, initMobileDrawer } from './modules/menu.js';
import { initHeroSlider } from './modules/hero-slider.js';
import { initShop } from './modules/shop.js';
import { initCartBadge, initCartDrawer } from './modules/cart-ui.js';
import { initCartPage } from './modules/cart-page.js';
import { initNewsletter } from './modules/newsletter.js';
import { initCheckout } from './modules/checkout.js';
import { initOrderSuccess } from './modules/order-success.js';
import { initAuth } from './modules/auth.js';
import { initCounters } from './modules/counter.js';
import { initStoreHours } from './modules/store-hours.js';
import { initContact } from './modules/contact.js';
import { initProductList } from './modules/product-list.js';
import { initProductDetail } from './modules/product-detail.js';
import { initCampaignCountdown, initSmoothAnchors } from './modules/campaigns.js';
import { initProductSliders } from './modules/product-slider.js';
import { initOrders } from './modules/orders.js';
import { initAccountLink } from './modules/account-link.js';

initPreloader();

createIcons({
  icons: {
    Truck, ShieldCheck, Headset, User, Search, Heart, ShoppingCart,
    Menu, ChevronDown, ChevronRight, X, ArrowRight, ArrowLeft, MessagesSquare,
    Layers, Ruler, FlaskConical, LayoutGrid, BrickWall, Building2, Sofa, Boxes,
    Package, Star, SwatchBook, Building, Mail,
    MapPin, Phone, Clock, Lock,
    CircleCheck, CreditCard, Landmark, Store, Info,
    Eye, EyeOff, UserPlus, LogIn, LogOut,
    Target, Award, Handshake, Users, Leaf,
    Navigation, MessageCircle,
    Send,
    SlidersHorizontal, SearchX,
    Calculator,
  },
  attrs: { 'stroke-width': 1.75 },
});

// Footer'daki yılı otomatik güncelle
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

initMegaMenu();
initMobileDrawer();
initHeroSlider();
initCartBadge();
initCartDrawer();
initCartPage();
initShop();
initNewsletter();
initCheckout();
initOrderSuccess();
initAuth();
initCounters();
initStoreHours();
initContact();
initProductList();
initProductDetail();
initCampaignCountdown();
initProductSliders();
initOrders();
initAccountLink();
initSmoothAnchors();