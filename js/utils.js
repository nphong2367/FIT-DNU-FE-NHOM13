const FashionHub = (() => {
 
  // ─────────────────────────────────────────────
  //  1. CONFIG — hằng số toàn project
  // ─────────────────────────────────────────────
 
  const CONFIG = {
    API_URL:       "https://69f9a69cc509a40d3aa2ee09.mockapi.io/api/v1/products",
    STORAGE_USER:       "fh_user",       // key lưu user đăng nhập
    STORAGE_CART:       "fh_cart",       // key lưu giỏ hàng
    STORAGE_WISH:       "fh_wishlist",   // key lưu danh sách yêu thích
    STORAGE_REGISTERED: "fh_reg",        // key lưu tài khoản đăng ký
    TOAST_TIMEOUT:      3000,             // ms toast tự ẩn
    FREE_SHIP_MIN:      499000,           // đơn tối thiểu miễn phí ship
    SHIP_FEE:           30000,            // phí ship khi chưa đủ
    DEMO_USER: {
      email:    "user@fashionhub.vn",
      password: "123456",
      name:     "Khách hàng",
      role:     "user"
    },
    DEMO_ADMIN: {
      email:    "admin@fashionhub.vn",
      password: "admin123",
      name:     "Admin",
      role:     "admin"
    }
  };
 
  const Storage = {
    get(key, defaultValue = null) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
      } catch {
        return defaultValue;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem(key);
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  2. AUTH — đăng nhập / đăng xuất / kiểm tra quyền
  // ─────────────────────────────────────────────
 
  const Auth = {
 
    /**
     * Lấy thông tin user đang đăng nhập.
     * @returns {Object|null} user object hoặc null nếu chưa đăng nhập
     */
    getUser() {
      return Storage.get(CONFIG.STORAGE_USER, null);
    },
 
    /**
     * Lấy tài khoản đã đăng ký.
     */
    getRegistered() {
      return Storage.get(CONFIG.STORAGE_REGISTERED, null);
    },
 
    /**
     * Lưu user vào localStorage (gọi sau khi đăng nhập thành công).
     * @param {Object} userObj - { name, email, role }
     */
    setUser(userObj) {
      Storage.set(CONFIG.STORAGE_USER, userObj);
    },
 
    /**
     * Đăng xuất — xóa user khỏi localStorage.
     * @param {string} [redirectTo="login.html"] - trang chuyển đến sau khi logout
     */
    logout(redirectTo = "login.html") {
      Storage.remove(CONFIG.STORAGE_USER);
      if (redirectTo) window.location.href = redirectTo;
    },
 
    /**
     * Kiểm tra đã đăng nhập chưa.
     * @returns {boolean}
     */
    isLoggedIn() {
      return !!Auth.getUser();
    },
 
    /**
     * Kiểm tra có phải admin không.
     * @returns {boolean}
     */
    isAdmin() {
      const u = Auth.getUser();
      return u?.role === "admin";
    },
 
    /**
     * Bảo vệ trang admin: nếu không phải admin → chuyển về login.
     * Gọi ngay đầu admin.html
     */
    requireAdmin() {
      if (!Auth.isAdmin()) {
        window.location.href = "login.html";
      }
    },
 
    /**
     * Xử lý đăng nhập user thường.
     * @param {string} email
     * @param {string} password
     * @returns {{ success: boolean, message: string }}
     */
    loginUser(email, password) {
      const normalizedEmail = email.trim().toLowerCase();
      const { DEMO_USER } = CONFIG;
      const registered = Auth.getRegistered();
      const matchReg = registered && registered.email.toLowerCase() === normalizedEmail && registered.password === password;
      const matchDemo = normalizedEmail === DEMO_USER.email && password === DEMO_USER.password;
 
      if (matchDemo || matchReg) {
        const name = matchReg ? registered.name : DEMO_USER.name;
        Auth.setUser({ name, email: normalizedEmail, role: "user" });
        return { success: true, message: `Chào mừng ${name}!` };
      }
      return { success: false, message: "Email hoặc mật khẩu không đúng!" };
    },
 
    /**
     * Xử lý đăng nhập admin.
     * @param {string} email
     * @param {string} password
     * @returns {{ success: boolean, message: string }}
     */
    loginAdmin(email, password) {
      const { DEMO_ADMIN } = CONFIG;
      if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
        Auth.setUser({ name: DEMO_ADMIN.name, email, role: "admin" });
        return { success: true, message: "Đăng nhập quản trị thành công!" };
      }
      return { success: false, message: "Sai thông tin quản trị viên!" };
    },
 
    /**
     * Đăng ký tài khoản mới.
     * @param {{ firstName, lastName, email, phone, password }} data
     * @returns {{ success: boolean, message: string }}
     */
    register({ firstName, lastName, email, phone, password }) {
      if (!firstName || !lastName || !email || !password) {
        return { success: false, message: "Vui lòng điền đầy đủ thông tin!" };
      }
      if (password.length < 6) {
        return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự!" };
      }
      if (!Validate.email(email)) {
        return { success: false, message: "Email không hợp lệ!" };
      }
      const normalizedEmail = email.trim().toLowerCase();
      const existing = Auth.getRegistered();
      if (existing && existing.email.toLowerCase() === normalizedEmail) {
        return { success: false, message: "Email đã được đăng ký trước đó!" };
      }
      const name = `${lastName} ${firstName}`;
      Storage.set(CONFIG.STORAGE_REGISTERED, { name, email: normalizedEmail, phone, password });
      return { success: true, message: "🎉 Đăng ký thành công! Vui lòng đăng nhập." };
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  3. TOAST — thông báo popup góc màn hình
  // ─────────────────────────────────────────────
 
  const Toast = {
 
    _getContainer() {
      let el = document.getElementById("toastContainer");
      if (!el) {
        el = document.createElement("div");
        el.id = "toastContainer";
        el.style.cssText = "position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;";
        document.body.appendChild(el);
      }
      return el;
    },
 
    /**
     * Hiển thị toast thông báo.
     * @param {string} message - nội dung hiển thị
     * @param {"success"|"error"|"info"|"warning"} [type="success"]
     */
    show(message, type = "success") {
      const colors = {
        success: "#c9a84c",
        error:   "#e74c3c",
        info:    "#3498db",
        warning: "#f39c12"
      };
      const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
 
      const t = document.createElement("div");
      t.style.cssText = `
        background: #1a1a1a;
        color: white;
        padding: 0.85rem 1.5rem;
        border-radius: 8px;
        font-size: 0.88rem;
        font-family: 'DM Sans', sans-serif;
        margin-top: 0.5rem;
        border-left: 3px solid ${colors[type] || colors.success};
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        animation: fhSlideUp 0.3s ease;
        max-width: 320px;
        cursor: pointer;
      `;
      t.innerHTML = `<span style="margin-right:.6rem">${icons[type] || icons.success}</span>${message}`;
      t.onclick = () => t.remove();
 
      // Thêm keyframe animation nếu chưa có
      if (!document.getElementById("fhToastStyle")) {
        const s = document.createElement("style");
        s.id = "fhToastStyle";
        s.textContent = "@keyframes fhSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}";
        document.head.appendChild(s);
      }
 
      Toast._getContainer().appendChild(t);
      setTimeout(() => t.remove(), CONFIG.TOAST_TIMEOUT);
    },
 
    success: (msg) => Toast.show(msg, "success"),
    error:   (msg) => Toast.show(msg, "error"),
    info:    (msg) => Toast.show(msg, "info"),
    warning: (msg) => Toast.show(msg, "warning")
  };
 
 
  // ─────────────────────────────────────────────
  //  4. FORMAT — định dạng dữ liệu hiển thị
  // ─────────────────────────────────────────────
 
  const Format = {
 
    /**
     * Định dạng số thành tiền VNĐ.
     * @param {number|string} amount
     * @returns {string} VD: "299.000đ"
     */
    currency(amount) {
      return Number(amount).toLocaleString("vi-VN") + "đ";
    },
 
    /**
     * Rút gọn chuỗi nếu quá dài.
     * @param {string} str
     * @param {number} [maxLen=40]
     * @returns {string}
     */
    truncate(str, maxLen = 40) {
      const text = String(str || "");
      return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
    },
 
    /**
     * Định dạng ngày tháng theo kiểu Việt Nam.
     * @param {string|Date} dateInput
     * @returns {string} VD: "13/05/2025 14:30"
     */
    date(dateInput) {
      const d = new Date(dateInput);
      if (Number.isNaN(d.getTime())) return "";
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
 
    /**
     * Tạo rating stars HTML.
     * @param {number} [score=5] - điểm từ 1-5
     * @returns {string} VD: "★★★★☆"
     */
    stars(score = 5) {
      const full = Math.round(score);
      return "★".repeat(full) + "☆".repeat(5 - full);
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  5. VALIDATE — kiểm tra dữ liệu form
  // ─────────────────────────────────────────────
 
  const Validate = {
 
    /**
     * Kiểm tra định dạng email hợp lệ.
     * @param {string} email
     * @returns {boolean}
     */
    email(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    },
 
    /**
     * Kiểm tra số điện thoại Việt Nam.
     * @param {string} phone
     * @returns {boolean}
     */
    phone(phone) {
      return /^(0|\+84)[3-9]\d{8}$/.test(phone.replace(/\s/g, ""));
    },
 
    /**
     * Kiểm tra URL ảnh hợp lệ.
     * @param {string} url
     * @returns {boolean}
     */
    imageUrl(url) {
      return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url.trim());
    },
 
    /**
     * Kiểm tra giá tiền hợp lệ.
     * @param {number|string} price
     * @returns {boolean}
     */
    price(price) {
      const n = Number(price);
      return !isNaN(n) && n > 0;
    },
 
    /**
     * Kiểm tra form thêm sản phẩm (dùng trong admin.html).
     * @param {{ tenSanPham, gia, hinhAnh }} data
     * @returns {{ valid: boolean, message: string }}
     */
    productForm({ tenSanPham, gia, hinhAnh }) {
      if (!tenSanPham || tenSanPham.trim().length < 3) {
        return { valid: false, message: "Tên sản phẩm phải có ít nhất 3 ký tự!" };
      }
      if (!Validate.price(gia)) {
        return { valid: false, message: "Giá sản phẩm không hợp lệ!" };
      }
      if (!hinhAnh || typeof hinhAnh !== "string" || !hinhAnh.trim().startsWith("http")) {
        return { valid: false, message: "Link ảnh không hợp lệ! Phải bắt đầu bằng http/https" };
      }
      return { valid: true, message: "" };
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  6. API — gọi MockAPI sản phẩm
  // ─────────────────────────────────────────────
 
  const API = {
 
    /**
     * Lấy tất cả sản phẩm.
     * @returns {Promise<Array>}
     */
    async getProducts() {
      const res = await fetch(CONFIG.API_URL);
      if (!res.ok) throw new Error(`API lỗi: ${res.status}`);
      return res.json();
    },
 
    /**
     * Lấy một sản phẩm theo ID.
     * @param {string|number} id
     * @returns {Promise<Object>}
     */
    async getProduct(id) {
      const res = await fetch(`${CONFIG.API_URL}/${id}`);
      if (!res.ok) throw new Error(`Không tìm thấy sản phẩm ID: ${id}`);
      return res.json();
    },
 
    /**
     * Thêm sản phẩm mới.
     * @param {{ tenSanPham, gia, hinhAnh, loaiSanPham }} data
     * @returns {Promise<Object>} sản phẩm vừa tạo
     */
    async addProduct(data) {
      const res = await fetch(CONFIG.API_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Thêm sản phẩm thất bại!");
      return res.json();
    },
 
    /**
     * Cập nhật sản phẩm.
     * @param {string|number} id
     * @param {Object} data - các field cần cập nhật
     * @returns {Promise<Object>} sản phẩm đã cập nhật
     */
    async updateProduct(id, data) {
      const res = await fetch(`${CONFIG.API_URL}/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Cập nhật sản phẩm thất bại!");
      return res.json();
    },
 
    /**
     * Xóa sản phẩm.
     * @param {string|number} id
     * @returns {Promise<void>}
     */
    async deleteProduct(id) {
      const res = await fetch(`${CONFIG.API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa sản phẩm thất bại!");
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  7. CART — quản lý giỏ hàng (lưu localStorage)
  // ─────────────────────────────────────────────
 
  const Cart = {
 
    _load() {
      return Storage.get(CONFIG.STORAGE_CART, []);
    },
 
    _save(items) {
      Storage.set(CONFIG.STORAGE_CART, items);
    },
 
    /**
     * Lấy toàn bộ giỏ hàng.
     * @returns {Array<{ id, tenSanPham, gia, hinhAnh, qty }>}
     */
    getAll() {
      return Cart._load();
    },
 
    /**
     * Thêm sản phẩm vào giỏ. Nếu đã có thì tăng qty.
     * @param {Object} product - object sản phẩm từ API
     * @param {number} [qty=1]
     */
    add(product, qty = 1) {
      if (!product || !product.id) return;
      const items = Cart._load();
      const existing = items.find(i => i.id == product.id);
      if (existing) {
        existing.qty = (existing.qty || 1) + Math.max(1, qty);
      } else {
        items.push({ ...product, qty: Math.max(1, qty) });
      }
      Cart._save(items);
    },
 
    /**
     * Xóa một sản phẩm khỏi giỏ.
     * @param {string|number} id
     */
    remove(id) {
      Cart._save(Cart._load().filter(i => i.id != id));
    },
 
    /**
     * Thay đổi số lượng một sản phẩm.
     * @param {string|number} id
     * @param {number} qty - số lượng mới (nếu <= 0 thì xóa)
     */
    setQty(id, qty) {
      if (qty <= 0) { Cart.remove(id); return; }
      const items = Cart._load();
      const item = items.find(i => i.id == id);
      if (item) { item.qty = qty; Cart._save(items); }
    },
 
    /**
     * Xóa toàn bộ giỏ hàng.
     */
    clear() {
      Cart._save([]);
    },
 
    /**
     * Tổng số lượng sản phẩm trong giỏ (tính qty).
     * @returns {number}
     */
    totalQty() {
      return Cart._load().reduce((s, i) => s + (i.qty || 1), 0);
    },
 
    /**
     * Tổng tiền hàng (chưa tính ship).
     * @returns {number}
     */
    subtotal() {
      return Cart._load().reduce((s, i) => s + Number(i.gia) * (i.qty || 1), 0);
    },
 
    /**
     * Phí vận chuyển dựa trên giá trị đơn hàng.
     * @returns {number} 0 nếu miễn phí, CONFIG.SHIP_FEE nếu chưa đủ
     */
    shippingFee() {
      return Cart.subtotal() >= CONFIG.FREE_SHIP_MIN ? 0 : CONFIG.SHIP_FEE;
    },
 
    /**
     * Tổng tiền thanh toán (hàng + ship).
     * @returns {number}
     */
    total() {
      return Cart.subtotal() + Cart.shippingFee();
    },
 
    /**
     * Lấy summary dạng chuỗi để hiển thị.
     * @returns {{ subtotal, shipping, total }} — đã format VNĐ
     */
    getSummary() {
      const ship = Cart.shippingFee();
      return {
        subtotal: Format.currency(Cart.subtotal()),
        shipping: ship === 0 ? "Miễn phí" : Format.currency(ship),
        total:    Format.currency(Cart.total())
      };
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  8. WISHLIST — danh sách yêu thích
  // ─────────────────────────────────────────────
 
  const Wishlist = {
 
    _load() {
      return Storage.get(CONFIG.STORAGE_WISH, []);
    },
 
    _save(ids) {
      Storage.set(CONFIG.STORAGE_WISH, ids);
    },
 
    /** Kiểm tra sản phẩm có trong wishlist không. */
    has(id) {
      return Wishlist._load().includes(String(id));
    },
 
    /** Thêm sản phẩm vào wishlist. */
    add(id) {
      const list = Wishlist._load();
      if (!list.includes(String(id))) { list.push(String(id)); Wishlist._save(list); }
    },
 
    /** Xóa sản phẩm khỏi wishlist. */
    remove(id) {
      Wishlist._save(Wishlist._load().filter(i => i !== String(id)));
    },
 
    /** Toggle (thêm nếu chưa có, xóa nếu đã có). Trả về true nếu đã thêm. */
    toggle(id) {
      if (Wishlist.has(id)) { Wishlist.remove(id); return false; }
      Wishlist.add(id); return true;
    },
 
    /** Tổng số sản phẩm yêu thích. */
    count() {
      return Wishlist._load().length;
    },
 
    /** Lấy tất cả ID yêu thích. */
    getAll() {
      return Wishlist._load();
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  9. CATEGORY — phân loại sản phẩm
  // ─────────────────────────────────────────────
 
  const Category = {
 
    MAP: {
      ao:       ["áo", "shirt", "top", "blouse", "polo", "tshirt", "áo thun", "áo sơ mi", "áo khoác", "len"],
      quan:     ["quần", "jean", "pant", "trouser", "short", "chino"],
      vay:      ["váy", "đầm", "dress", "skirt", "chân váy"],
      giay:     ["giày", "dép", "sneaker", "heel", "boot", "sandal"],
      tui:      ["túi", "bag", "handbag", "backpack", "clutch", "tote"],
      phuKien:  ["phụ kiện", "accessory", "hat", "belt", "scarf", "mũ", "thắt lưng", "khăn", "vòng", "nhẫn"]
    },
 
    LABELS: {
      ao: "Áo", quan: "Quần", vay: "Váy/Đầm",
      giay: "Giày dép", tui: "Túi xách", phuKien: "Phụ kiện"
    },
 
    FALLBACK: ["ao", "quan", "vay", "giay", "tui", "phuKien"],
 
    /**
     * Nhận diện danh mục sản phẩm tự động.
     * Ưu tiên: field loaiSanPham → tên sản phẩm → index fallback.
     * @param {Object} item - sản phẩm từ API
     * @param {number} index - vị trí trong mảng (cho fallback)
     * @returns {string} key danh mục: "ao"|"quan"|"vay"|"giay"|"tui"|"phuKien"
     */
    detect(item, index = 0) {
      const sources = [
        (item.loaiSanPham || "").toLowerCase(),
        (item.category    || "").toLowerCase(),
        (item.tenSanPham  || "").toLowerCase()
      ];
 
      for (const text of sources) {
        if (!text) continue;
        for (const [key, keywords] of Object.entries(Category.MAP)) {
          if (keywords.some(kw => text.includes(kw))) return key;
        }
      }
      return Category.FALLBACK[index % Category.FALLBACK.length];
    },
 
    /**
     * Lấy nhãn tiếng Việt của danh mục.
     * @param {string} key
     * @returns {string}
     */
    label(key) {
      return Category.LABELS[key] || "Thời trang";
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  10. UI HELPERS — các hàm hỗ trợ giao diện
  // ─────────────────────────────────────────────
 
  const UI = {
 
    /**
     * Hiển thị/ẩn loading spinner.
     * @param {boolean} show
     * @param {string} [selector="#loading"]
     */
    loading(show, selector = "#loading") {
      const el = document.querySelector(selector);
      if (el) el.style.display = show ? "block" : "none";
    },
 
    /**
     * Vô hiệu hóa button và đổi text khi đang submit.
     * @param {HTMLElement} btn
     * @param {boolean} disabled
     * @param {string} [loadingText="Đang xử lý..."]
     * @param {string} [originalText=""] - text gốc để khôi phục
     */
    setButtonLoading(btn, disabled, loadingText = "Đang xử lý...", originalText = "") {
      btn.disabled = disabled;
      if (disabled) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = loadingText;
      } else {
        btn.textContent = originalText || btn.dataset.originalText || btn.textContent;
      }
    },
 
    /**
     * Hiển thị thông báo lỗi dưới một input.
     * @param {string} inputId - id của ô input
     * @param {string} message - nội dung lỗi (rỗng để xóa)
     */
    setFieldError(inputId, message) {
      const input = document.getElementById(inputId);
      if (!input || !input.parentElement) return;
      let err = input.parentElement.querySelector(".field-error");
      if (message) {
        if (!err) {
          err = document.createElement("div");
          err.className = "field-error";
          err.style.cssText = "color:#e74c3c;font-size:0.78rem;margin-top:0.25rem;";
          input.parentElement.appendChild(err);
        }
        err.textContent = message;
        input.style.borderColor = "#e74c3c";
      } else {
        err?.remove();
        input.style.borderColor = "";
      }
    },
 
    /**
     * Cập nhật số badge trên icon giỏ hàng / wishlist.
     * @param {string} selector - VD: "#cartCount"
     * @param {number} count
     */
    updateBadge(selector, count) {
      const el = document.querySelector(selector);
      if (!el) return;
      el.textContent = count;
      el.style.display = count > 0 ? "flex" : "none";
    }
  };
 
 
  // ─────────────────────────────────────────────
  //  EXPORT — public API của util.js
  // ─────────────────────────────────────────────
 
  return { CONFIG, Storage, Auth, Toast, Format, Validate, API, Cart, Wishlist, Category, UI };
 
})();
 
 
/* ─── Shorthand toàn cục (tuỳ chọn) ─────────────────────────
   Cho phép gọi trực tiếp: FHAuth.getUser(), FHToast.show(...)
   thay vì FashionHub.Auth.getUser(), FashionHub.Toast.show(...)
──────────────────────────────────────────────────────────── */
const FHAuth      = FashionHub.Auth;
const FHToast     = FashionHub.Toast;
const FHFormat    = FashionHub.Format;
const FHValidate  = FashionHub.Validate;
const FHAPI       = FashionHub.API;
const FHCart      = FashionHub.Cart;
const FHWishlist  = FashionHub.Wishlist;
const FHCategory  = FashionHub.Category;
const FHUI        = FashionHub.UI;
const FH_CONFIG   = FashionHub.CONFIG;
// ─────────────────────────────────────────────
//  11. EXTRA HELPERS — tiện ích bổ sung
// ─────────────────────────────────────────────

const Extra = {

  /**
   * Debounce (chống spam input search)
   */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Xác nhận trước khi xoá
   */
  confirm(message = "Bạn có chắc chắn không?") {
    return window.confirm(message);
  },

  /**
   * Ảnh fallback nếu lỗi
   */
  imgFallback(imgEl, fallback = "https://via.placeholder.com/300x300?text=No+Image") {
    imgEl.onerror = () => {
      imgEl.src = fallback;
    };
  },

  /**
   * Delay async
   */
  sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
};


// ─────────────────────────────────────────────
//  12. GLOBAL FUNCTIONS — dùng trực tiếp trong HTML
// ─────────────────────────────────────────────

/**
 * LOGIN USER
 */
window.doLogin = function () {
  const emailEl = document.getElementById("loginEmail");
  const passEl = document.getElementById("loginPass");
  const errorEl = document.getElementById("loginError");
  if (!emailEl || !passEl || !errorEl) return;

  const email = emailEl.value.trim();
  const pass  = passEl.value.trim();
  const res = FHAuth.loginUser(email, pass);

  if (res.success) {
    FHToast.success(res.message);
    setTimeout(() => location.href = "index.html", 800);
  } else {
    errorEl.style.display = "block";
  }
};


/**
 * LOGIN ADMIN
 */
window.doAdminLogin = function () {
  const emailEl = document.getElementById("adminEmail");
  const passEl = document.getElementById("adminPass");
  if (!emailEl || !passEl) return;

  const email = emailEl.value.trim();
  const pass  = passEl.value.trim();
  const res = FHAuth.loginAdmin(email, pass);

  if (res.success) {
    FHToast.success(res.message);
    setTimeout(() => location.href = "admin.html", 800);
  } else {
    FHToast.error(res.message);
  }
};


/**
 * LOGOUT
 */
window.doLogout = function () {
  if (Extra.confirm("Bạn muốn đăng xuất?")) {
    FHAuth.logout();
  }
};


// ─────────────────────────────────────────────
//  13. USER UI RENDER — hiển thị login/header
// ─────────────────────────────────────────────

const UserUI = {

  renderHeader(selector = "#userArea") {
    const el = document.querySelector(selector);
    if (!el) return;

    const user = FHAuth.getUser();

    if (!user) {
      el.innerHTML = `
        <a href="login.html" class="btn-user">
          <i class="bi bi-person"></i> Đăng nhập
        </a>
      `;
      return;
    }

    el.innerHTML = `
      <div class="dropdown">
        <button class="btn-user dropdown-toggle" data-bs-toggle="dropdown">
          👋 ${user.name}
        </button>
        <ul class="dropdown-menu">
          ${user.role === "admin"
            ? `<li><a class="dropdown-item" href="admin.html">⚙️ Quản trị</a></li>`
            : ""
          }
          <li><a class="dropdown-item" href="#" onclick="doLogout()">🚪 Đăng xuất</a></li>
        </ul>
      </div>
    `;
  }
};


// ─────────────────────────────────────────────
//  14. SAFE API WRAPPER — chống crash
// ─────────────────────────────────────────────

const SafeAPI = {

  async call(fn, errorMsg = "Có lỗi xảy ra!") {
    try {
      FHUI.loading(true);
      const data = await fn();
      return data;
    } catch (err) {
      console.error(err);
      FHToast.error(errorMsg);
      return null;
    } finally {
      FHUI.loading(false);
    }
  }
};


// ─────────────────────────────────────────────
//  EXPORT BỔ SUNG
// ─────────────────────────────────────────────

FashionHub.Extra   = Extra;
FashionHub.UserUI  = UserUI;
FashionHub.SafeAPI = SafeAPI;


// shorthand
const FHExtra   = Extra;
const FHUserUI  = UserUI;
const FHSafeAPI = SafeAPI;