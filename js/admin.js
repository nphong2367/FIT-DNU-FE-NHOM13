// Cập nhật lại trong thẻ <script>
let allProducts = []; // Lưu trữ danh sách gốc để tìm kiếm

function loadProducts() {
    $('#loading').show();
    $.get(API_URL, function(res) {
        allProducts = res; // Lưu vào biến tổng
        renderUI(allProducts);
        $('#loading').hide();
    });
}

// Tính năng tìm kiếm (Yêu cầu bổ sung)
$('#txtSearch').on('input', function() {
    const keyword = $(this).val().toLowerCase();
    const filtered = allProducts.filter(item => 
        item.tenSanPham.toLowerCase().includes(keyword)
    );
    renderUI(filtered);
});

function addToCart(name) {
    // Thay thế alert bằng Toast chuyên nghiệp
    const toast = $(`
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 3000">
            <div class="toast show bg-info text-white" role="alert">
                <div class="toast-body">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    Đã thêm <b>${name}</b> vào giỏ hàng!
                </div>
            </div>
        </div>
    `);
    $('body').append(toast);
    setTimeout(() => toast.remove(), 3000); // Tự biến mất sau 3 giây

    // Cập nhật số lượng giỏ hàng
    let count = parseInt($('#cartCount').text());
    $('#cartCount').text(count + 1);
}