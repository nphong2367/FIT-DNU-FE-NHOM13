// BƯỚC 1: QUAN TRỌNG NHẤT - Thay link này bằng link Endpoint của bạn
const API_URL = "https://69f9a69cc509a40d3aa2ee09.mockapi.io/api/v1/products"; 

let products = [];
let cart = [];

// 2. Hàm lấy dữ liệu (AJAX)
function loadProducts() {
    console.log("Đang gọi API..."); // Kiểm tra xem hàm có chạy không
    $('#loading').show();

    $.ajax({
        url: API_URL,
        type: 'GET',
        success: function(res) {
            console.log("Dữ liệu nhận về thành công:", res); // Xem dữ liệu có bị trống không
            products = res;
            if (products.length === 0) {
                $('#productGrid').html('<p class="text-center">MockAPI đang trống, hãy thêm sản phẩm!</p>');
            } else {
                renderUI(products);
            }
            $('#loading').hide();
        },
        error: function(xhr) {
            console.error("Lỗi kết nối API:", xhr.statusText);
            $('#productGrid').html('<p class="text-center text-danger">Lỗi: Không kết nối được với MockAPI!</p>');
            $('#loading').hide();
        }
    });
}

// 3. Hàm hiển thị (Render) - Kiểm tra kỹ tên trường dữ liệu
function renderUI(list) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = list.map(item => `
        <div class="col-12 col-sm-6 col-lg-3">
            <div class="card p-2 shadow">
                <!-- Chú ý: item.hinhAnh phải đúng chữ hoa/thường như trong MockAPI -->
                <img src="${item.hinhAnh}" class="card-img-top rounded" alt="img" onerror="this.src='https://placehold.co/400x600?text=Fashion'">
                <div class="card-body px-1 text-white">
                    <h6 class="card-title text-truncate">${item.tenSanPham}</h6>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="price text-info fw-bold">${Number(item.gia).toLocaleString()}đ</span>
                        <button class="btn btn-sm btn-outline-info" onclick="addToCart(${item.id})">
                            <i class="bi bi-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 4. Giỏ hàng
function addToCart(id) {
    const item = products.find(p => p.id == id);
    cart.push(item);
    $('#cartCount').text(cart.length);
    alert("Đã thêm vào giỏ hàng!");
}

// KHỞI CHẠY KHI TRANG LOAD XONG
$(document).ready(function() {
    loadProducts();
});